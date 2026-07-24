# AI Interior Designer

Transform any room into your dream space using Artificial Intelligence.

Upload a photo of any room, pick a design style, and receive a professional
design brief: room classification with confidence, color palette, furniture
picks, lighting plan, and 5–8 tailored recommendations.

The project ships in two parts that share the same JSON contract:

- **`frontend/`** — a production React + TypeScript app (this repo root) built
  with TanStack Start, Tailwind CSS v4, Framer-Motion-style animations via
  Tailwind, and Lucide icons. In this repository the frontend lives at the
  root (see `src/`), and it is deployed on Lovable.
- **`flask-backend/`** — a complete Python Flask + PyTorch + Hugging Face
  Transformers backend implementing the same `/predict` endpoint. It runs
  locally and produces the exact JSON shape the frontend expects.

## Features

- Drag & drop image upload with validation (JPG/JPEG/PNG, max 10 MB)
- 8 curated design styles (Modern, Minimalist, Scandinavian, Luxury,
  Industrial, Bohemian, Japandi, Contemporary)
- Room classification across 7 room types with confidence score
- Color palette suggestions rendered as copy-to-clipboard swatches
- Furniture, lighting, and design recommendations
- Local design history in the browser (last 12 designs)
- Premium Apple-HIG-style UI: glassmorphism, soft gradients, subtle animation
- Fully responsive, mobile-first

## Supported room types

Bedroom · Living Room · Kitchen · Bathroom · Office · Dining Room · Study Room

## Application flow

```
User opens homepage
        ↓
Uploads a room image + picks a style
        ↓
Image sent to backend (server function on Lovable, or Flask locally)
        ↓
Backend classifies the room + generates design suggestions
        ↓
Frontend displays: uploaded image, room type, confidence,
                   recommendations, palette, furniture, lighting
```

## Project structure

```
AI-Interior-Designer/
├── frontend/            # this repo (see src/)
│   └── src/
│       ├── components/  # Navbar, Footer, cards
│       ├── lib/
│       │   └── designer.functions.ts   # server function, mirrors /predict
│       └── routes/
│           ├── index.tsx    # landing page
│           ├── upload.tsx   # drag & drop + style picker
│           └── result.tsx   # design brief dashboard
├── flask-backend/       # standalone Flask + PyTorch backend
│   ├── app.py           # Flask routes
│   ├── classifier.py    # PyTorch room classifier (modular)
│   ├── designer.py      # style-aware recommendation module
│   ├── config.py        # environment-driven config
│   ├── utils.py         # image + IO helpers
│   ├── requirements.txt
│   ├── uploads/         # (runtime, created on first upload)
│   ├── outputs/         # (runtime, reserved for tomorrow's SD outputs)
│   └── models/          # (runtime, cached model weights)
└── README.md
```

## Requirements

**Frontend**

- Node 20+ / Bun 1+
- Runs on Lovable, or locally with `bun dev` / `npm run dev`

**Flask backend**

- Python 3.10+
- pip 23+
- ~2 GB free disk for pretrained model weights (torchvision + HF)

## Running the frontend

The frontend runs on Lovable out of the box (this repo). To run locally:

```bash
bun install     # or: npm install
bun dev         # or: npm run dev
```

The app opens on http://localhost:8080. It calls a TanStack server function
(`analyzeRoom`) that uses Lovable AI (Gemini vision) for classification and
recommendations. That endpoint is the drop-in equivalent of `/predict`.

## Running the Flask backend

```bash
cd flask-backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py                    # starts on http://localhost:5000
```

Environment variables (optional, see `flask-backend/config.py`):

| Variable         | Default                | Purpose                          |
|------------------|------------------------|----------------------------------|
| `HOST`           | `0.0.0.0`              | Bind host                        |
| `PORT`           | `5000`                 | Bind port                        |
| `UPLOAD_DIR`     | `uploads`              | Where uploaded images are saved  |
| `OUTPUT_DIR`     | `outputs`              | Reserved for SD outputs (Day 2)  |
| `MODEL_DIR`      | `models`               | Torch/HF cache location          |
| `MAX_UPLOAD_MB`  | `10`                   | Upload size limit                |
| `DEVICE`         | auto (`cuda` if avail) | Torch device                     |

To point the frontend at the local Flask backend instead of the Lovable
server function, replace the body of `analyzeRoom` in
`src/lib/designer.functions.ts` with a `fetch("http://localhost:5000/predict")`
call. The JSON shape is identical.

## `/predict` — API contract

`POST /predict` — `multipart/form-data`

Fields:

- `image` — the room photo (jpg/jpeg/png, ≤ 10 MB)
- `style` — one of `Modern`, `Minimalist`, `Scandinavian`, `Luxury`,
  `Industrial`, `Bohemian`, `Japandi`, `Contemporary`

Response (200):

```json
{
  "room_type": "Bedroom",
  "confidence": 0.94,
  "style": "Minimalist",
  "recommendations": ["...", "...", "...", "...", "..."],
  "color_palette": ["#F5F5F5", "#D6CFC7", "#A89F91"],
  "lighting": "Warm LED ambient lighting",
  "furniture": ["Wooden nightstand", "Floating shelves", "Area rug"]
}
```

## Future work

- **Day 2:** Stable Diffusion image generation of the redesigned room.
  The architecture is already modular — a `generator.py` module can plug
  into `flask-backend/app.py` and add a `/generate` route without touching
  the classifier or the designer.
- Authenticated cloud-side design history (currently stored in the
  browser's localStorage).
- Fine-tuned interior room classifier trained on Places365 + custom data.
- Multi-image comparison and before/after views.

## License

MIT
