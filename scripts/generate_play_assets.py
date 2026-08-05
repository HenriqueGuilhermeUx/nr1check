from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path("play-store/generated")
OUT.mkdir(parents=True, exist_ok=True)

BRAND = "#2563EB"
DARK = "#111827"
WHITE = "#FFFFFF"
MUTED = "#E5E7EB"
GREEN = "#22C55E"
SLATE = "#334155"

try:
    FONT_BLACK = ImageFont.truetype("DejaVuSans-Bold.ttf", 76)
    FONT_BOLD = ImageFont.truetype("DejaVuSans-Bold.ttf", 60)
    FONT_TITLE = ImageFont.truetype("DejaVuSans-Bold.ttf", 52)
    FONT_MED = ImageFont.truetype("DejaVuSans.ttf", 34)
    FONT_SMALL = ImageFont.truetype("DejaVuSans.ttf", 26)
except Exception:
    FONT_BLACK = FONT_BOLD = FONT_TITLE = FONT_MED = FONT_SMALL = ImageFont.load_default()


def rounded_rect(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def center_text(draw, box, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    x = box[0] + (box[2] - box[0] - (bbox[2] - bbox[0])) / 2
    y = box[1] + (box[3] - box[1] - (bbox[3] - bbox[1])) / 2
    draw.text((x, y), text, font=font, fill=fill)


def app_icon():
    img = Image.new("RGB", (512, 512), DARK)
    d = ImageDraw.Draw(img)
    rounded_rect(d, (58, 54, 454, 458), 92, BRAND)
    d.polygon([(256, 112), (374, 166), (374, 252), (256, 398), (138, 252), (138, 166)], fill=WHITE)
    d.line([(190, 260), (236, 306), (326, 216)], fill=BRAND, width=30, joint="curve")
    center_text(d, (72, 430, 440, 500), "NR1Check", FONT_SMALL, WHITE)
    img.save(OUT / "icon-512.png")


def feature_graphic():
    img = Image.new("RGB", (1024, 500), DARK)
    d = ImageDraw.Draw(img)
    rounded_rect(d, (58, 58, 438, 442), 58, BRAND)
    d.text((102, 112), "NR1Check", font=FONT_BOLD, fill=WHITE)
    d.text((102, 196), "Acesso simples\npara a NR-1", font=FONT_TITLE, fill=WHITE, spacing=8)
    d.text((102, 356), "Funcionários, patrões, RH e gestores.", font=FONT_MED, fill=MUTED)

    cards = [(530, "Funcionário", GREEN), (720, "Patrão/RH", BRAND)]
    for x, label, color in cards:
        rounded_rect(d, (x, 150, x + 150, 300), 38, color)
        center_text(d, (x, 150, x + 150, 300), "✓", FONT_BOLD, WHITE)
        center_text(d, (x - 25, 326, x + 175, 376), label, FONT_SMALL, WHITE)
    img.save(OUT / "feature-graphic-1024x500.png")


def phone_screenshot(filename, title, subtitle, bullets):
    img = Image.new("RGB", (1080, 1920), "#F8FAFC")
    d = ImageDraw.Draw(img)
    rounded_rect(d, (70, 80, 1010, 430), 62, BRAND)
    d.text((120, 145), "NR1Check", font=FONT_BLACK, fill=WHITE)
    d.text((120, 250), title, font=FONT_TITLE, fill=WHITE)
    d.text((120, 330), subtitle, font=FONT_MED, fill="#DBEAFE")

    y = 520
    for headline, body in bullets:
        rounded_rect(d, (70, y, 1010, y + 190), 42, WHITE, outline="#E5E7EB", width=3)
        rounded_rect(d, (115, y + 45, 205, y + 135), 26, BRAND)
        center_text(d, (115, y + 45, 205, y + 135), "✓", FONT_TITLE, WHITE)
        d.text((245, y + 46), headline, font=FONT_TITLE, fill=DARK)
        d.text((245, y + 112), body, font=FONT_SMALL, fill=SLATE)
        y += 230

    rounded_rect(d, (70, 1640, 1010, 1810), 44, DARK)
    d.text((120, 1690), "Alternative Ventures Ltda", font=FONT_MED, fill=WHITE)
    d.text((120, 1745), "CNPJ 61.920.356/0001-38", font=FONT_SMALL, fill=MUTED)
    img.save(OUT / filename)


def main():
    app_icon()
    feature_graphic()
    phone_screenshot(
        "screenshot-01-funcionario.png",
        "Funcionário",
        "CPF cadastrado + código",
        [
            ("Entrar com CPF", "Acesso apenas para trabalhador cadastrado."),
            ("Responder avaliação", "Fluxo simples pelo celular."),
            ("Enviar relato", "Canal para situações sensíveis."),
            ("Confirmar ciência", "Documentos e comunicados no app."),
        ],
    )
    phone_screenshot(
        "screenshot-02-patrao.png",
        "Patrão e RH",
        "Painel rápido da empresa",
        [
            ("Minha empresa", "Cockpit com o que falta fazer."),
            ("Funcionários", "Cadastro e importação da equipe."),
            ("Enviar link", "Convide trabalhadores para o app."),
            ("Documentos", "Evidências e assinaturas."),
        ],
    )
    phone_screenshot(
        "screenshot-03-acesso.png",
        "Acesso controlado",
        "Mais simples para revisão e uso real",
        [
            ("Empresa autenticada", "Patrão/RH entra com conta própria."),
            ("Funcionário validado", "CPF cadastrado e código de acesso."),
            ("Botão sair", "Sessão pode ser encerrada no app."),
            ("Sem painel confuso", "Ações do dia a dia em destaque."),
        ],
    )


if __name__ == "__main__":
    main()
