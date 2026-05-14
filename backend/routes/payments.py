import os
import dotenv
dotenv.load_dotenv()
import uuid
import razorpay
from fastapi import APIRouter, BackgroundTasks, HTTPException
from database import db
from models.payment import PaymentCreate, PaymentResponse, PaymentVerify
from services.whatsapp_service import notify_photographer_payment

router = APIRouter()

# Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID", "dummy_key"), os.getenv("RAZORPAY_KEY_SECRET", "dummy_secret")))

@router.post("/create-order", response_model=PaymentResponse)
async def create_order(payment_in: PaymentCreate):
    price = 0.0
    folder_id = None
    
    if payment_in.paymentType == "GLOBAL":
        # Fixed price for global search (Option A)
        price = float(os.getenv("GLOBAL_SEARCH_PRICE", "99"))
    else:
        if not payment_in.clientFolderId:
             raise HTTPException(status_code=400, detail="clientFolderId is required for FOLDER payment")
        folder = await db.clientfolder.find_unique(where={"id": payment_in.clientFolderId})
        if not folder:
            raise HTTPException(status_code=404, detail="Client folder not found")
        if not folder.isPaid or folder.price is None or folder.price <= 0:
            raise HTTPException(status_code=400, detail="This folder is not a paid collection")
        price = folder.price
        folder_id = folder.id

    # Razorpay expects amount in paise
    amount = int(price * 100)
    
    try:
        # Create Razorpay Order
        rzp_key = os.getenv("RAZORPAY_KEY_ID", "dummy_key")
        if rzp_key == "dummy_key":
            order = {"id": f"order_dummy_{uuid.uuid4().hex[:10]}"}
        else:
            order = razorpay_client.order.create({
                "amount": amount,
                "currency": "INR",
                "receipt": f"receipt_{folder_id[:8] if folder_id else 'global'}_{uuid.uuid4().hex[:6]}",
                "payment_capture": "1"
            })
        
        # Save payment to DB
        payment = await db.payment.create(
            data={
                "razorpayOrderId": order['id'],
                "amount": price,
                "status": "PENDING",
                "paymentType": payment_in.paymentType,
                "guestName": payment_in.guestName,
                "guestEmail": payment_in.guestEmail,
                "clientFolderId": folder_id
            }
        )
        
        return PaymentResponse(
            id=payment.id,
            razorpayOrderId=payment.razorpayOrderId,
            amount=payment.amount,
            status=payment.status,
            guestName=payment.guestName,
            guestEmail=payment.guestEmail,
            guestToken=payment.guestToken,
            paymentType=payment.paymentType,
            createdAt=payment.createdAt,
            clientFolderId=payment.clientFolderId
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_payment(data: PaymentVerify, background_tasks: BackgroundTasks):
    try:
        # Verify Signature
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }
        
        rzp_key = os.getenv("RAZORPAY_KEY_ID", "dummy_key")
        if rzp_key != "dummy_key":
            razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Generate a unique guest token for auto access
        guest_token = uuid.uuid4().hex
        
        # Update DB
        payment = await db.payment.update(
            where={"razorpayOrderId": data.razorpay_order_id},
            data={
                "status": "SUCCESS",
                "razorpayPaymentId": data.razorpay_payment_id,
                "guestToken": guest_token
            },
            include={"clientFolder": True}
        )
        
        # Add WhatsApp notification
        if payment.clientFolder and payment.clientFolder.whatsappNo:
            background_tasks.add_task(
                notify_photographer_payment,
                photographer_number=payment.clientFolder.whatsappNo,
                event_name=payment.clientFolder.name,
                amount=payment.amount,
                guest_name=payment.guestName
            )
        
        return {"status": "success", "guestToken": guest_token}
    except Exception as e:
        try:
            await db.payment.update(
                where={"razorpayOrderId": data.razorpay_order_id},
                data={"status": "FAILED", "razorpayPaymentId": data.razorpay_payment_id}
            )
        except:
            pass
        raise HTTPException(status_code=400, detail="Invalid Payment Signature")
