import sys
import json
import traceback
from pathlib import Path

# Add engine directory to path
ENGINE_DIR = Path(__file__).resolve().parent.parent / "engine"
sys.path.insert(0, str(ENGINE_DIR))

from layer2_ai import analyze_tax_with_ai

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data.strip():
            print(json.dumps({"ok": False, "error": "Empty input"}))
            return
            
        payload = json.loads(input_data)
        
        advice = analyze_tax_with_ai(payload)
        
        print(json.dumps({"ok": True, "advice": advice}))
    except Exception as e:
        print(json.dumps({
            "ok": False,
            "error": str(e),
            "trace": traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
