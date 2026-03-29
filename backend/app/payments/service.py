class PaymentService:
    @staticmethod
    def verify_upi_payment(order, payment_gateway_id: str = None) -> dict:
        return {"verified": True, "gateway_id": payment_gateway_id or "MANUAL"}

    @staticmethod
    def get_payment_status_after_confirm() -> str:
        return "COMPLETED"

    @staticmethod
    def get_payment_status_after_cancel() -> str:
        return "FAILED"
