from app.database import SessionLocal, engine, Base
from app.models import plants, users, firms
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    
    plant1 = db.query(plants.Plant).filter_by(code="P001").first()
    if not plant1:
        print("Seeding plants...")
        plant1 = plants.Plant(code="P001", name="Jaipur Main", location="Jaipur", manager_name="Amit Singh")
        db.add(plant1)
        db.commit()
        db.refresh(plant1)
    
    if not db.query(users.User).first():
        print("Seeding users...")
        store_officer = users.User(
            name="Rajesh Kumar",
            email="rajesh@plant1.local",
            password_hash=get_password_hash("secure_password"),
            role="store_officer",
            plant_id=plant1.id
        )
        accounts_officer = users.User(
            name="Sunita Sharma",
            email="sunita@plant1.local",
            password_hash=get_password_hash("secure_password"),
            role="accounts_officer",
            plant_id=plant1.id
        )
        db.add(store_officer)
        db.add(accounts_officer)
        
        admin_user = users.User(
            name="HQ Administrator",
            email="admin@hq.local",
            password_hash=get_password_hash("secure_password"),
            role="admin",
            plant_id=None
        )
        db.add(admin_user)
        db.commit()
    
    if not db.query(firms.Firm).first():
        print("Seeding firms...")
        firm1 = firms.Firm(
            name="ABC Suppliers",
            gstin="08AABC1234F1Z5",
            contact_person="Ravi",
            email="ravi@abc.com",
            payment_terms="Net 30"
        )
        db.add(firm1)
        db.commit()
        
    print("Database seeding completed!")
    db.close()

if __name__ == "__main__":
    seed_db()
