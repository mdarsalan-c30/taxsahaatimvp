import os
import json
from groq import Groq

def analyze_tax_with_ai(layer2_handoff: dict) -> str:
    """
    Calls Groq API to analyze the deterministic Layer 1 handoff payload
    and generate personalized, expert-level CA advice.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return (
            "⚠️ **AI CA Brain is offline.**\n\n"
            "The `GROQ_API_KEY` environment variable is not configured. "
            "Your tax calculation is complete, but AI-guided advice is currently unavailable. "
            "Please contact the administrator or add your API key to the environment."
        )

    client = Groq(api_key=api_key)

    system_prompt = """
    You are an expert Indian Chartered Accountant (CA).
    You will receive a JSON payload containing the user's tax profile, income summary,
    deductions, regime comparison, and identified risk flags.
    
    Your job is to:
    1. Explain their tax situation in clear, simple terms.
    2. Highlight which regime is better and exactly how much they save.
    3. Point out any missed deductions or risk flags (e.g., high refund mismatch).
    4. Provide 2-3 actionable next steps for filing or optimizing next year.
    
    Use Markdown formatting. Keep your tone professional, reassuring, and easy to understand.
    Do not hallucinate legal sections not in the payload.
    """

    user_prompt = f"Here is the taxpayer's Layer 1 Handoff Data:\n\n{json.dumps(layer2_handoff, indent=2)}"

    try:
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=1024,
            top_p=1,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"⚠️ **AI CA Brain encountered an error.**\n\nUnable to generate advice at this time: {str(e)}"
