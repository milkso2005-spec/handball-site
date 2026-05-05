import os
import sys
sys.path.append('backend')
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import models

load_dotenv('backend/.env')

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate():
    db = SessionLocal()
    try:
        # 1. Seed Players
        print("Seeding Players...")
        players = [
            models.Player(name="MALICK MANE", poste="Pivot", category="actif", stats_buts=156, stats_matches=45, stats_passes=32, years="2021 - Présent"),
            models.Player(name="Mouhamed Niang", poste="Pivot", category="actif", stats_buts=234, stats_matches=98, stats_passes=178, years="2019 - Présent"),
            models.Player(name="Aliou Thioye", poste="Demi-centre", category="actif", stats_buts=312, stats_matches=112, stats_passes=456, years="2018 - Présent"),
            models.Player(name="Mamadou Lamine Sonko", poste="Gardien", category="actif", stats_buts=3, stats_matches=87, stats_passes=124, years="2020 - Présent"),
            models.Player(name="Baye Dame Ngom", poste="Ailier gauche", category="actif", stats_buts=456, stats_matches=95, stats_passes=198, years="2017 - Présent"),
            models.Player(name="Abdou Magib Sy", poste="Ailier droit", category="actif", stats_buts=287, stats_matches=103, stats_passes=234, years="2020 - Présent"),
            models.Player(name="Omar Ndiaye", poste="Arrière gauche", category="actif", stats_buts=389, stats_matches=108, stats_passes=167, years="2019 - Présent"),
        ]
        db.add_all(players)

        # 2. Seed Matches
        print("Seeding Matches...")
        matches = [
            models.Match(home_team="HB Team", away_team="AS Dakar", home_score=28, away_score=24, status="En direct", competition="Championnat National - Journée 18"),
            models.Match(home_team="HB Team", away_team="US Thiès", home_score=32, away_score=27, status="Terminé", competition="Championnat National - Journée 17"),
            models.Match(home_team="HB Team", away_team="CSS Louga", home_score=25, away_score=30, status="Terminé", competition="Coupe du Sénégal - Quart de finale"),
        ]
        db.add_all(matches)

        # 3. Seed Trophies
        print("Seeding Trophies...")
        trophies = [
            models.Trophy(year="2024", name="Double Championnat-Coupe", description="Une saison historique marquée par une domination sans partage sur le plan national."),
            models.Trophy(year="2022", name="Supercoupe Nationale", description="Victoire arrachée dans les dernières secondes face à notre rival historique."),
            models.Trophy(year="2020", name="Championnat National", description="Le retour au sommet après une phase de reconstruction intense."),
            models.Trophy(year="2018", name="Triplé Historique", description="Championnat, Coupe et Supercoupe remportés la même année."),
            models.Trophy(year="2015", name="Coupe du Sénégal", description="Un parcours héroïque éliminant tous les favoris."),
            models.Trophy(year="2012", name="Premier Tour International", description="Nos premiers pas et notre première victoire sur la scène continentale."),
            models.Trophy(year="2010", name="Championnat National (2e titre)", description="La confirmation de notre statut de grand club."),
            models.Trophy(year="2007", name="Premier Championnat National", description="Le début de l'épopée HB Team."),
        ]
        db.add_all(trophies)

        # 4. Seed Hommages
        print("Seeding Hommages...")
        hommages = [
            models.Hommage(name="Coach Ibrahim Ndiaye", subtitle="Coach Fondateur • 2003 - 2023", message="Le handball n'est pas juste un sport, c'est une famille. Coach Ibrahim a été le père de cette famille pendant plus de 20 ans. Sa sagesse, sa patience et sa passion ont façonné des générations de champions."),
            models.Hommage(name="Souleymane Diop", subtitle="Pivot Légendaire • 2005 - 2015", message="Souleymane était plus qu'un joueur, c'était un frère pour chacun d'entre nous. Son sourire illuminait les vestiaires, sa combativité sur le terrain inspirait toute l'équipe."),
            models.Hommage(name="Aminata Fall", subtitle="Capitaine Féminine • 2010 - 2020", message="Aminata a été la voix du handball féminin dans notre communauté. En tant que joueuse puis entraîneuse, elle a ouvert la voie à de nombreuses jeunes filles."),
        ]
        db.add_all(hommages)

        db.commit()
        print("Migration completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
