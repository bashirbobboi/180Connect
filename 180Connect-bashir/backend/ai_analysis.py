import ollama
import os

# === MAIN EMAIL GENERATION FUNCTION ===
def generate_email(client_name, client_type, mission, website, tone="professional"):
    """
    Generate a structured, optimized outreach email using Llama 3 (8B) via Ollama, with streaming enabled.

    Args:
        client_name (str): Name of the client organization.
        client_type (str): Type of client (e.g., nonprofit, business).
        mission (str): Client's mission statement.
        website (str): Client's website URL.
        tone (str): Tone of the email (default: "professional").

    Returns:
        tuple: (subject_line, email_body)
    """

    # === PROMPT TEMPLATE ===
    # Edit the prompt below to change the structure or style of the generated email.
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

    # === OLLAMA CALL ===
    # You can adjust model, num_predict, temperature, and top_p for different AI behavior.
    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}],
        options={
            "num_predict": 350,  # Max tokens to generate
            "temperature": 0.5,  # Lower = more deterministic, higher = more creative
            "top_p": 0.8,        # Controls diversity of output
        },
        stream=True  # Enables streaming output
    )

    # === STREAMING OUTPUT HANDLING ===
    email_content = ""
    print("\n📩 Generating Email...\n", end="", flush=True)

    for chunk in response:
        content_piece = chunk["message"]["content"]
        print(content_piece, end="", flush=True)  # Print each piece as it arrives
        email_content += content_piece

    print("\n\n✅ Email Generation Complete!\n")

    # === SUBJECT & BODY EXTRACTION ===
    # This logic splits the AI output into subject and body.
    subject_line = "No Subject Found"
    email_body = email_content

    if "Subject:" in email_content:
        parts = email_content.split("Subject:", 1)
        subject_line = parts[1].split("\n", 1)[0].strip()  # Extract subject
        email_body_lines = parts[1].split("\n")[1:]        # Extract email body
        email_body = "\n".join(email_body_lines).strip()

    return subject_line, email_body

# === SAVE EMAIL TO FILE ===
def save_email_txt(client_name, subject, email_body):
    """
    Save AI-generated email to a TXT file inside the 'emails/' directory.

    Args:
        client_name (str): Name of the client (used for filename).
        subject (str): Email subject line.
        email_body (str): Email body content.
    """
    os.makedirs("emails", exist_ok=True)  # Ensure directory exists

    filename = f"emails/{client_name.replace(' ', '_')}.txt"

    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"Subject: {subject}\n\n{email_body}")

    print(f"📁 Email saved to {filename}")

# === EXAMPLE USAGE ===
if __name__ == "__main__":
    client_name = "SHEFFIELD CITY TRUST"

    # Generate email (streaming enabled)
    subject, email_body = generate_email(
        client_name=client_name,
        client_type="nonprofit organization",
        mission="Promoting the benefit of the inhabitants of South Yorkshire",
        website="http://www.sheffieldcitytrust.org.uk",
        tone="professional"
    )

    # Save to a file
    save_email_txt(client_name, subject, email_body)

    # Print the generated email
    print(f"\n📩 AI-Generated Email:\nSubject: {subject}\n\n{email_body}")
