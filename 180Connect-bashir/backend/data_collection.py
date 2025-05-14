import requests
import pandas as pd
import base64
import json
import time  # For rate limiting
import os
import sys

# === PATH SETUP FOR RELATIVE IMPORTS ===
# Ensures config and other modules can be imported regardless of how the script is run.
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# === IMPORT API KEYS FROM CONFIG ===
from backend.config import CHARITYBASE_API_KEY, COMPANIES_HOUSE_API_KEY

# === API ENDPOINTS ===
CHARITYBASE_URL = "https://charitybase.uk/api/graphql"
COMPANIES_HOUSE_ADVANCED_URL = "https://api.company-information.service.gov.uk/advanced-search/companies"
COMPANIES_HOUSE_DETAILS_URL = "https://api.company-information.service.gov.uk/company/"

# ------------------------
# FETCH CHARITY DATA (CharityBase API)
# ------------------------
def fetch_charity_data():
    """
    Fetch charity data from CharityBase using the Yorkshire region filter.
    Edit the GraphQL query to change region or data fields.
    """
    query = """
    query {
      CHC {
        getCharities(filters: {geo: {region: E12000003}}) {
          count
          list(limit: 30) {
            id
            names {
              value
            }
            activities
            contact {
              address
              email
              postcode
            }
            website
          }
        }
      }
    }
    """

    headers = {
        "Authorization": f"Apikey {CHARITYBASE_API_KEY}",
        "Content-Type": "application/json"
    }

    response = requests.post(CHARITYBASE_URL, headers=headers, data=json.dumps({"query": query}))

    if response.status_code == 200:
        data = response.json()
        if "errors" in data:
            print(f"GraphQL errors: {data['errors']}")
            return []
        return data["data"]["CHC"]["getCharities"]["list"]
    else:
        print(f"Error fetching CharityBase data: {response.status_code} - {response.text}")
        return []

# ------------------------
# FETCH COMPANIES FROM COMPANIES HOUSE API
# ------------------------

# === CITY AND COMPANY TYPE FILTERS ===
# Edit YORKSHIRE_CITIES to change the regions you want to fetch.
YORKSHIRE_CITIES = [
    "Sheffield", "Leeds", "Bradford", "Kingston upon Hull", "Wakefield",
    "York", "Doncaster", "Barnsley", "Rotherham", "Huddersfield",
    "Halifax", "Harrogate", "Scunthorpe", "Grimsby", "Beverley",
    "Pontefract", "Selby", "Goole", "Keighley", "Batley", "Dewsbury",
    "Bridlington", "Thorne", "Ilkley", "Ripon", "Yorkshire",
    "West Yorkshire", "South Yorkshire", "North Yorkshire", "East Riding of Yorkshire"
]

# Company types and SIC codes for filtering
AUTO_INCLUDE_TYPES = [
    "charitable-incorporated-organisation", "scottish-charitable-incorporated-organisation",
    "further-education-or-sixth-form-college-corporation"
]
CIC_TYPES = [
    "private-limited-guarant-nsc", "private-limited-guarant-nsc-limited-exemption",
    "plc", "ltd"
]
FILTER_BY_SIC_TYPES = [
    "royal-charter", "united-kingdom-societas"
]
SOCIAL_IMPACT_SIC_CODES = {
    # Add or remove SIC codes here to change which companies are included as social enterprises
    "8531", "8532", "88910", "88990", "94990", "8010", "8021", "8022", "8030", "8042",
    "85510", "85520", "85530", "85590", "85600", "86101", "86102", "86210", "86220", "86230",
    "86900", "87100", "87200", "87300", "87900", "90010", "90020", "90030", "90040", "91011",
    "91012", "91020", "91030", "91040", "93110", "93120", "93130", "93191", "93199", "93210",
    "93290", "36000", "37000", "38110", "38120", "38210", "38220", "38310", "38320", "39000",
    "9131", "9132"
}

def fetch_company_details(company_number, headers):
    """Fetch company details including SIC codes and subtype."""
    url = f"{COMPANIES_HOUSE_DETAILS_URL}{company_number}"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        return {}

def fetch_companies_data():
    """
    Fetch company data from Companies House API for all cities in YORKSHIRE_CITIES.
    Edit this function to change filters, add new regions, or adjust company type logic.
    """
    encoded_api_key = base64.b64encode(f"{COMPANIES_HOUSE_API_KEY}:".encode()).decode()
    headers = {"Authorization": f"Basic {encoded_api_key}"}

    all_companies = []
    city_stats = {}  # To store statistics for each city

    for city in YORKSHIRE_CITIES:
        print(f"\n🔍 Searching for companies in {city}...")
        city_stats[city] = {"auto_include": 0, "cic_types": 0, "sic_filtered": 0}
        
        # --- Auto-include types ---
        auto_include_params = {
            "company_type": AUTO_INCLUDE_TYPES,
            "location": city,
            "size": "100",
            "company_status": "active"
        }
        auto_response = requests.get(COMPANIES_HOUSE_ADVANCED_URL, headers=headers, params=auto_include_params)
        if auto_response.status_code == 200:
            auto_data = auto_response.json().get("items", [])
            city_stats[city]["auto_include"] = len(auto_data)
            print(f"  ✅ Found {len(auto_data)} auto-include type companies in {city}")
            for c in auto_data:
                company_info = {
                    "id": c.get("company_number", "N/A"),
                    "name": c.get("company_name", "N/A"),
                    "status": c.get("company_status", "N/A"),
                    "company_type": c.get("company_type", "N/A"),
                    "address": c.get("registered_office_address", {}).get("address_snippet", "N/A"),
                    "postcode": c.get("registered_office_address", {}).get("postal_code", "N/A"),
                    "website": f"https://find-and-update.company-information.service.gov.uk/company/{c.get('company_number', '')}",
                    "source": "Companies House"
                }
                all_companies.append(company_info)
        time.sleep(1)  # Rate limiting

        # --- CIC types ---
        cic_params = {
            "company_type": CIC_TYPES,
            "company_subtype": "community-interest-company",
            "location": city,
            "size": "10",
            "company_status": "active"
        }
        cic_response = requests.get(COMPANIES_HOUSE_ADVANCED_URL, headers=headers, params=cic_params)
        if cic_response.status_code == 200:
            cic_data = cic_response.json().get("items", [])
            city_stats[city]["cic_types"] = len(cic_data)
            print(f"  ✅ Found {len(cic_data)} CIC type companies in {city}")
            for c in cic_data:
                company_info = {
                    "id": c.get("company_number", "N/A"),
                    "name": c.get("company_name", "N/A"),
                    "status": c.get("company_status", "N/A"),
                    "company_type": c.get("company_type", "N/A"),
                    "address": c.get("registered_office_address", {}).get("address_snippet", "N/A"),
                    "postcode": c.get("registered_office_address", {}).get("postal_code", "N/A"),
                    "website": f"https://find-and-update.company-information.service.gov.uk/company/{c.get('company_number', '')}",
                    "source": "Companies House"
                }
                all_companies.append(company_info) 
        time.sleep(1)  # Rate limiting

        # --- SIC code filtered companies ---
        sic_filtered_params = {
            "company_type": FILTER_BY_SIC_TYPES,
            "location": city,
            "size": "100",
            "company_status": "active"
        }
        sic_response = requests.get(COMPANIES_HOUSE_ADVANCED_URL, headers=headers, params=sic_filtered_params)
        if sic_response.status_code == 200:
            sic_data = sic_response.json().get("items", [])
            for c in sic_data:
                company_info = {
                    "id": c.get("company_number", "N/A"),
                    "name": c.get("company_name", "N/A"),
                    "status": c.get("company_status", "N/A"),
                    "company_type": c.get("company_type", "N/A"),
                    "address": c.get("registered_office_address", {}).get("address_snippet", "N/A"),
                    "postcode": c.get("registered_office_address", {}).get("postal_code", "N/A"),
                    "website": f"https://find-and-update.company-information.service.gov.uk/company/{c.get('company_number', '')}",
                    "source": "Companies House"
                }
                company_details = fetch_company_details(company_number, headers)
                sic_codes = set(company_details.get("sic_codes", []))
                if sic_codes.intersection(SOCIAL_IMPACT_SIC_CODES):
                    all_companies.append(company_info)
                    city_stats[city]["sic_filtered"] += 1
        time.sleep(1)  # Rate limiting

    # --- Print summary statistics ---
    print("\n📊 Summary of Companies Found:")
    print("=" * 50)
    print(f"{'City':<15} | {'Auto-Include':<15} | {'CIC Types':<15} | {'SIC-Filtered':<15} | {'Total':<10}")
    print("-" * 50)

    total_auto = 0
    total_cic = 0
    total_sic = 0

    for city, stats in city_stats.items():
        auto_count = stats["auto_include"]
        cic_count = stats["cic_types"]
        sic_count = stats["sic_filtered"]
        city_total = auto_count + cic_count + sic_count
        total_auto += auto_count
        total_cic += cic_count
        total_sic += sic_count

        print(f"{city:<15} | {auto_count:<15} | {cic_count:<15} | {sic_count:<15} | {city_total:<10}")

    print("-" * 50)
    print(f"{'TOTAL':<15} | {total_auto:<15} | {total_cic:<15} | {total_sic:<15} | {total_auto + total_cic + total_sic:<10}")
    print("=" * 50)
    print(f"\n🚀 Total companies retrieved: {len(all_companies)}")

    return all_companies

# ------------------------
# COMBINE & CLEAN DATA
# ------------------------
def get_client_data():
    """
    Fetch data from multiple sources, clean it, and save to a CSV file.
    Edit this function to change how data is combined or to add new sources.
    """
    charities = fetch_charity_data() or []
    companies = fetch_companies_data() or []

    print(f"✅ Total charities retrieved: {len(charities)}")
    print(f"✅ Total non-profit/social enterprises retrieved: {len(companies)}")

    # Normalize and combine data
    charity_list = [
        {
            "id": c["id"],
            "name": c["names"][0]["value"] if "names" in c and c["names"] else "N/A",
            "status": "Active",
            "company_type": "Charity",
            "address": ", ".join(c["contact"].get("address", [])) if c.get("contact") and isinstance(c["contact"].get("address"), list) else "N/A",
            "email": c["contact"]["email"] if c.get("contact") else "N/A",
            "postcode": c["contact"]["postcode"] if c.get("contact") else "N/A",
            "website": c["website"] if "website" in c else "N/A",
            "activities": c["activities"] if "activities" in c else "N/A",
            "source": "CharityBase"
        }
        for c in charities
    ]
    company_list = [
        {
            "id": c.get("id", "N/A"),
            "name": c.get("name", "N/A"),
            "status": c.get("status", "N/A"),
            "company_type": c.get("company_type", "N/A"),
            "address": c.get("address", "N/A"),
            "postcode": c.get("postcode", "N/A"),
            "website": c.get("website", "N/A"),
            "source": "Companies House"
        }
        for c in companies
    ]

    # Combine all sources and remove duplicates
    df = pd.DataFrame(charity_list + company_list)
    df.drop_duplicates(subset="name", keep="first", inplace=True)

    # Save to CSV in the 'clients' directory
    clients_dir = os.path.join(parent_dir, "clients")
    os.makedirs(clients_dir, exist_ok=True)
    csv_path = os.path.join(clients_dir, "client_data.csv")
    df.to_csv(csv_path, index=False)
    print(f"✅ Data saved to '{csv_path}' (Total entries: {len(df)})")

    return df

# ------------------------
# DATABASE POPULATION FUNCTIONS
# ------------------------
from sqlalchemy.orm import Session
from models import Company, Source
from database import SessionLocal

def chunk_list(lst, chunk_size):
    """Split list into chunks of specified size."""
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]

def get_locations_from_postcodes(postcodes: list) -> dict:
    """
    Fetch city and region data in bulk from postcodes.io API.
    Used to enrich client data with location info.
    """
    valid_postcodes = [p for p in postcodes if p and p != "N/A"]
    if not valid_postcodes:
        return {}
    location_data = {}
    chunks = chunk_list(valid_postcodes, 100)  # API allows max 100 postcodes per request
    for chunk in chunks:
        try:
            response = requests.post(
                "https://api.postcodes.io/postcodes",
                json={"postcodes": chunk}
            )
            if response.status_code == 200:
                results = response.json()["result"]
                for result in results:
                    if result["result"]:
                        postcode = result["query"]
                        data = result["result"]
                        location_data[postcode] = {
                            "city": data.get("admin_district", "N/A"),
                            "region": data.get("pfa", "N/A")
                        }
                    else:
                        location_data[result["query"]] = {
                            "city": "N/A",
                            "region": "N/A"
                        }
            time.sleep(0.5)  # Small delay between chunks
        except Exception as e:
            print(f"Error fetching locations for postcodes chunk: {str(e)}")
            continue
    return location_data

def get_or_create_source(db: Session, source_name: str):
    """
    Get or create a Source entry in the database.
    Used to track where client data came from.
    """
    source = db.query(Source).filter_by(name=source_name).first()
    if not source:
        source = Source(name=source_name)
        db.add(source)
        db.commit()
        db.refresh(source)
    return source

def get_client_data_for_database():
    """
    Fetch data from multiple sources, clean it, and save to the database.
    Edit this function to change how data is stored or to add new sources.
    """
    db: Session = SessionLocal()

    charities = fetch_charity_data() or []
    companies = fetch_companies_data() or []

    # Collect all postcodes
    charity_postcodes = [c["contact"]["postcode"] if c.get("contact") else "N/A" for c in charities]
    company_postcodes = [c.get("postcode", "N/A") for c in companies]
    location_data = get_locations_from_postcodes(charity_postcodes + company_postcodes)

    # Add CharityBase source
    charity_source = get_or_create_source(db, "CharityBase")
    for c in charities:
        postcode = c["contact"]["postcode"] if c.get("contact") else "N/A"
        location = location_data.get(postcode, {"city": "N/A", "region": "N/A"})
        company = Company(
            id_from_source=c["id"],
            name=c["names"][0]["value"] if "names" in c and c["names"] else "N/A",
            status="active",
            company_type="Charity",
            address=", ".join(c["contact"].get("address", [])) if c.get("contact") and isinstance(c["contact"].get("address"), list) else "N/A",
            email=c["contact"]["email"] if c.get("contact") else "N/A",
            postcode=postcode,
            website=c["website"] if "website" in c else "N/A",
            activities=c["activities"] if "activities" in c else "N/A",
            source_id=charity_source.id,
            city=location["city"],
            region=location["region"]
        )
        db.add(company)

    # Add Companies House source
    ch_source = get_or_create_source(db, "Companies House")
    for c in companies:
        postcode = c.get("postcode", "N/A")
        location = location_data.get(postcode, {"city": "N/A", "region": "N/A"})
        company = Company(
            id_from_source=c.get("id"),
            name=c.get("name", "N/A"),
            status=c.get("status", "N/A"),
            company_type=c.get("company_type", "N/A"),
            address=c.get("address", "N/A"),
            postcode=postcode,
            website=c.get("website", "N/A"),
            source_id=ch_source.id,
            city=location["city"],
            region=location["region"]
        )
        db.add(company)

    db.commit()
    db.close()
    print(f"✅ Data saved to database (Total entries: {len(charities) + len(companies)})")

# ------------------------
# RUN SCRIPT
# ------------------------
if __name__ == "__main__":
    # Run this script directly to fetch, clean, and save client data to CSV.
    df = get_client_data()
