"""
app/services/subscription_service.py
Logique métier des abonnements : création, expiration automatique.
"""
from datetime import date
from app.database import Database


class SubscriptionService:

    PLAN_PRICES = {
        'HOURLY':  10.0,
        'DAILY':   20.0,
        'MONTHLY': 150.0,
        'ANNUAL':  800.0,
    }

    @staticmethod
    def expire_old_subscriptions() -> int:
        """
        Passe en EXPIRED tous les abonnements ACTIVE dont end_date < aujourd'hui.
        Retourne le nombre de lignes mises à jour.
        """
        result = Database.execute_query(
            """UPDATE subscriptions
               SET status = 'EXPIRED', updated_at = NOW()
               WHERE status = 'ACTIVE' AND end_date < CURDATE()""",
        )
        return result if isinstance(result, int) else 0

    @staticmethod
    def get_price_for_plan(plan_type: str) -> float:
        return SubscriptionService.PLAN_PRICES.get(plan_type, 0.0)

    @staticmethod
    def create(user_id: int, license_plate: str, plan_type: str,
               start_date: date, end_date: date,
               vehicle_id: int | None = None,
               notes: str | None = None) -> int:
        """Crée un abonnement et retourne son ID."""
        price = SubscriptionService.get_price_for_plan(plan_type)

        sub_id = Database.execute_query(
            """INSERT INTO subscriptions
               (user_id, vehicle_id, license_plate, plan_type,
                start_date, end_date, price_paid, status, notes)
               VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE', %s)""",
            (user_id, vehicle_id, license_plate, plan_type,
             start_date, end_date, price, notes)
        )
        return sub_id
