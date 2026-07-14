from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path("play-store/generated")
OUT.mkdir(parents=True, exist_ok=True)

BRAND = "#2563EB"
DARK = "#111827"
WHITE = "#FFFFFF"
MUTED = "#E5E7EB"
GREEN = "#22C55E"
YELLOW = "#FACC15"

try:
    FONT_BOLD = ImageFont.truetype("DejaVuSans-Bold.ttf", 64)
    FONT_TITLE = ImageFont.truetype("DejaVuSans-Bold.ttf", 52)
    FONT_MED = ImageFont.truetype("DejaVuSans.ttf", 34)
    FONT_SMALL = ImageFont.truetype("DejaVuSans.ttf", 26)
except Exception:
    FONT_BOLD = FONT_TITLE = FONT_MED = FONT_SMALL = ImageFont.load_default()


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
    rounded_rect(d, (76, 66, 436, 446), 72, BRAND)
    d.polygon([(256, 118), (368, 168), (368, 250), (256, 392), (144, 250), (144, 168)], fill=WHITE)
    d.line([(190, 258), (235, 303), (326, 212)], fill=BRAND, width=28, joint="curve")
    d.text((96, 442), "NR1Check", font=FONT_MED, fill=WHITE)
    img.save(OUT / "icon-512.png")


def feature_graphic():
    img = Image.new("RGB", (1024, 500), DARK)
    d = ImageDraw.Draw(img)
    rounded_rect(d, (56, 64, 410, 436), 56, BRAND)
    d.text((96, 120), "NR1Check", font=FONT_BOLD, fill=WHITE)
    d.text((96, 202), "NR-1 no bolso\nde quem precisa agir", font=FONT_TITLE, fill=WHITE, spacing=8)
    d.text((96, 355), "Funcionário responde. Patrão acompanha.", font=FONT_MED, fill=MUTED)
    for x, label, color in [(510, "Funcionário", GREEN), (690, "Patrão/RH", BRAND), (850, "PWA", YELLOW)]:
        rounded_rect(d, (x, 152, x + 130, 282), 32, color)
        center_text(d, (x, 152, x + 130, 282), "✓", FONT_BOLD, DARK if color == YELLOW else WHITE)
        center_text(d, (x - 25, 305, x + 155, 355), label, FONT_SMALL, WHITE)
    img.save(OUT / "feature-graphic-1024x500.png")


def phone_screenshot(filename, title, subtitle, bullets):
    img = Image.new("RGB", (1080, 1920), "#F8FAFC")
    d = ImageDraw.Draw(img)
    rounded_rect(d, (70, 80, 1010, 430), 58, BRAND)
    d.text((120, 145), "NR1Check", font=FONT_BOLD, fill=WHITE)
    d.text((120, 238), title, font=FONT_TITLE, fill=WHITE)
    d.text((120, 330), subtitle, font=FONT_MED, fill="#DBEAFE")
    y = 520
    for bullet in bullets:
        rounded_rect(d, (70, y, 1010, y + 190), 38, WHITE, outline="#E5E7EB", width=3)
        rounded_rect(d, (115, y + 45, 205, y + 135), 26, BRAND)
        center_text(d, (115, y + 45, 205, y + 135), "✓", FONT_TITLE, WHITE)
        d.text((245, y + 50), bullet[0], font=FONT_TITLE, fill=DARK)
        d.text((245, y + 115), bullet[1], font=FONT_SMALL, fill="#64748B")
        y += 230
    img.save(OUT / filename)


def main():
    app_icon()
    feature_graphic()
    phone_screenshot(
        "screenshot-01-funcionario.png",
        "Acesso do funcionário",
        "Simples, rápido e controlado",
        [
            ("Entrar com CPF", "Apenas trabalhadores cadastrados acessam."),
            ("Responder avaliação", "Fluxo mobile sem painel complexo."),
            ("Enviar relato", "Canal direto para situações sensíveis."),
            ("Confirmar ciência", "Documentos e comunicados no celular."),
        ],
    )
    phone_screenshot(
        "screenshot-02-patrao.png",
        "Cockpit do patrão",
        "O próximo passo sempre claro",
        [
            ("Checklist NR-1", "Veja o que falta fazer."),
            ("Importar equipe", "Funcionários por CSV/planilha."),
            ("Enviar link", "Compartilhe o app com trabalhadores."),
            ("Baixar documentos", "Evidências para gestão."),
        ],
    )
    phone_screenshot(
        "screenshot-03-pwa.png",
        "PWA instalável",
        "Use antes do app oficial",
        [
            ("Abra no navegador", "nr1check.netlify.app/app"),
            ("Adicione à tela inicial", "Fica com cara de aplicativo."),
            ("Pix via Woovi", "Liberação automática após pagamento."),
            ("Google Play", "Versão Android pronta para gerar AAB."),
        ],
    )

if __name__ == "__main__":
    main()
