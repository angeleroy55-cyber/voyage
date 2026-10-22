"""Correspondance entre nos destinations et les pages destination de Logitravel (slug de page)."""
import re
import unicodedata


def slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


# destination du catalogue -> pages Logitravel qui la couvrent (slug de page, dernier segment de l'URL)
MANUAL = {
    "Taghazout": ["agadir"],
    "Fès": ["fez"],
    "Charm el-Cheikh": ["sharm-el-sheikh"],
    "Alcúdia": ["majorque"],
    "Palma de Majorque": ["majorque"],
    "Lloret de Mar": ["costa-brava"],
    "Torremolinos": ["costa-del-sol"],
    "Malaga": ["costa-del-sol"],
    "Las Palmas": ["grande-canarie"],
    "Salou": ["costa-dorada"],
    "Mahón": ["minorque"],
    "Albufeira": ["cote-d-algarve"],
    "Faro": ["cote-d-algarve"],
    "Taormine": ["sicile"],
    "Catane": ["sicile"],
    "Olbia": ["sardaigne"],
    "Antalya": ["riviera-turque"],
    "Sliema": ["malte"],
    "Malé": ["maldives"],
    "Cancún": ["riviera-maya"],
    "Tulum": ["riviera-maya"],
    "Seminyak": ["bali"],
    "Ubud": ["bali"],
    "Denpasar": ["bali"],
    "Tachkent": ["taskent"],
    "Héraklion": ["crete"],
    "Crète": ["crete"],
    "Zanthe": ["zante"],
    "Corfou": ["ile-de-corfou"],
    "Poreč": ["istria"],
    "Ljubljana": ["liubliana"],
    "Innsbruck": ["tyrol"],
    "Rovaniemi": ["laponie"],
    "Koh Samui": ["ko-samui"],
    "Papeete": ["tahiti"],
    "Hanoï": ["ha-long"],
    "Flic en Flac": ["maurice"],
    "Belle Mare": ["maurice"],
    "Île Maurice": ["maurice"],
    "Sainte-Anne": ["grande-terre"],
    "Pointe-à-Pitre": ["guadeloupe", "grande-terre"],
    "Les Trois-Îlets": ["martinique"],
    "Fort-de-France": ["martinique"],
    "Saint-Gilles-les-Bains": ["ile-de-la-reunion"],
    "Saint-Denis": ["ile-de-la-reunion"],
    "Montego Bay": ["jamaique"],
    "Budva": ["petrovac"],
    "Hammamet": ["region-hammamet"],
    "Ténérife": ["tenerife"],
    "Grande Canarie": ["grande-canarie"],
    "Palma": ["majorque"],
    "Séville": ["seville"],
    "Valence": ["valence"],
    "Barcelone": ["barcelone"],
    "Lyon": ["metropole-de-lyon"],
    "Nice": ["cote-d-azur"],
    "Cannes": ["cote-d-azur"],
    "Ajaccio": ["corse"],
    "Porto-Vecchio": ["corse"],
    "Biarritz": ["cote-basque"],
    "Strasbourg": ["bas-rhin"],
    "Bordeaux": ["gironde"],
    "Rouen": ["cote-normande"],
    "Deauville": ["cote-normande"],
    "Phuket": ["phuket"],
    "Pékin": ["pekin"],
    "Édimbourg": ["edimbourg"],
    "Venise": ["venise"],
    "Cusco": ["cuzco"],
    "Singapour": ["ile-de-singapour"],
    "Dubaï": ["dubai"],
    "Las Vegas": ["las-vegas-nv"],
    "Orlando": ["orlando-fl"],
    "Madère": ["madere"],
    "San José": ["san-jose-de-costa-rica"],
    "Hoi An": ["hoi-an"],
    "Sal": ["ile-de-sal"],
    "Boa Vista": ["boa-vista"],
    "Mahé": ["ile-mahe"],
    "Varna": ["varna-mer-noire"],
    "Pas de la Case": ["pas-de-la-case"],
    "Prague": ["prague"],
}


def pages_for(dest: str, available: set) -> list:
    """Pages Logitravel disponibles pour une destination du catalogue."""
    if dest in MANUAL:
        got = [p for p in MANUAL[dest] if p in available]
        if got:
            return got
    s = slug(dest)
    if s in available:
        return [s]
    return []
