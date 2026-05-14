from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaymentCreate(BaseModel):
    clientFolderId: Optional[str] = None
    guestName: Optional[str] = None
    guestEmail: Optional[str] = None
    paymentType: str = "FOLDER" # FOLDER, GLOBAL


class PaymentResponse(BaseModel):
    id: str
    razorpayOrderId: str
    amount: float
    status: str
    guestName: Optional[str] = None
    guestEmail: Optional[str] = None
    guestToken: Optional[str] = None
    paymentType: str
    createdAt: datetime
    clientFolderId: Optional[str] = None

    model_config = {"from_attributes": True}


class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
