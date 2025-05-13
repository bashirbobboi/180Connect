import ollama
import os

def generate_email(client_name, client_type, mission, website, tone="professional"):
    """Generate a structured, optimized outreach email using Llama 3 (8B) via Ollama, with streaming enabled."""
    
    # OPTIMIZED PROMPT
    prompt = f"""
    Generate a {tone} outreach email for {client_name}, a {client_type}.
    
    - Purpose: Explain how 180 Degrees Consulting Sheffield can help with their mission: "{mission}."
    - Include: A subject line, a concise email body (max 200 words), and a call-to-action.

    Format:
    Subject: [Your Subject Line]
    
    Dear {client_name},
    
    [Your Email Content]
    
    Best regards,  
    180 Degrees Consulting Sheffield
    """

    # ✅ CALL OLLAMA WITH STREAMING ENABLED
    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}],
        options={
            "num_predict": 350,  # ✅ Limits response length for speed
            "temperature": 0.5,  # ✅ Keeps responses consistent
            "top_p": 0.8,  # ✅ Reduces randomness for better quality
        },
        stream=True  # ✅ Enables streaming (real-time output)
    )

    # ✅ STREAMING OUTPUT HANDLING
    email_content = ""
    print("\n📩 Generating Email...\n", end="", flush=True)

    for chunk in response:
        content_piece = chunk["message"]["content"]
        print(content_piece, end="", flush=True)  # ✅ Print each piece as it arrives
        email_content += content_piece

    print("\n\n✅ Email Generation Complete!\n")  # ✅ Print once generation is done

    # ✅ IMPROVED SUBJECT LINE & EMAIL BODY EXTRACTION
    subject_line = "No Subject Found"
    email_body = email_content

    if "Subject:" in email_content:
        parts = email_content.split("Subject:", 1)
        subject_line = parts[1].split("\n", 1)[0].strip()  # ✅ Extract subject
        email_body_lines = parts[1].split("\n")[1:]  # ✅ Extract email body
        email_body = "\n".join(email_body_lines).strip()

    return subject_line, email_body


# ✅ SAVE EMAIL FUNCTION
def save_email_txt(client_name, subject, email_body):
    """Save AI-generated email to a TXT file inside the 'emails/' directory."""
    
    os.makedirs("emails", exist_ok=True)  # Ensure directory exists
    
    filename = f"emails/{client_name.replace(' ', '_')}.txt"
    
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"Subject: {subject}\n\n{email_body}")  # ✅ Fixed formatting
    
    print(f"📁 Email saved to {filename}")

if __name__ == "__main__":
    client_name = "SHEFFIELD CITY TRUST"

    # ✅ Generate email (streaming enabled)
    subject, email_body = generate_email(
        client_name=client_name,
        client_type="nonprofit organization",
        mission="Promoting the benefit of the inhabitants of South Yorkshire",
        website="http://www.sheffieldcitytrust.org.uk",
        tone="professional"
    )

    # ✅ Save to a file
    save_email_txt(client_name, subject, email_body)

    # ✅ Print the generated email
    print(f"\n📩 AI-Generated Email:\nSubject: {subject}\n\n{email_body}")
