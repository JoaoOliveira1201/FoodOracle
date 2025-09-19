from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime, timedelta
import random


def generate_term_quote_pdf_topics(supplier_name, product_name, filename):
    # Setup PDF document
    doc = SimpleDocTemplate(filename, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Header
    title = Paragraph(f"<b>Supply Quotation</b>", styles["Title"])
    elements.append(title)
    elements.append(Spacer(1, 20))

    # Supplier info
    supplier_info = f"""
    <b>Supplier:</b> {supplier_name}<br/>
    <b>Contact:</b> {supplier_name.lower().replace(" ", ".")}@example.com<br/>
    <b>Date:</b> {datetime.today().strftime("%Y-%m-%d")}<br/>
    <b>Quote Valid Until:</b> {(datetime.today() + timedelta(days=30)).strftime("%Y-%m-%d")}<br/>
    """
    elements.append(Paragraph(supplier_info, styles["Normal"]))
    elements.append(Spacer(1, 20))

    # Contract details (randomized for realism)
    weekly_quantity = random.choice([25, 50, 100, 200])
    duration_months = random.choice([3, 6, 12])
    unit_price = round(random.uniform(1, 5), 2)  # price per kg
    weekly_cost = round(weekly_quantity * unit_price, 2)
    total_weeks = duration_months * 4
    total_cost = round(weekly_cost * total_weeks, 2)

    # Sections instead of a table
    elements.append(Paragraph("<b>Product & Delivery</b>", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"{supplier_name} proposes to supply <b>{weekly_quantity} kg</b> of <b>{product_name}</b> "
            f"every week, delivered directly to the buyer's warehouse.",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("<b>Pricing</b>", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Unit Price: EUR {unit_price:.2f} per kg<br/>"
            f"Weekly Supply Cost: EUR {weekly_cost:.2f}<br/>"
            f"Total Contract Value (for {duration_months} months): EUR {total_cost:.2f}",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("<b>Contract Duration</b>", styles["Heading2"]))
    elements.append(
        Paragraph(
            f"Start Date: {datetime.today().strftime('%Y-%m-%d')}<br/>"
            f"End Date: {(datetime.today() + timedelta(weeks=total_weeks)).strftime('%Y-%m-%d')}<br/>"
            f"Duration: {duration_months} months",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("<b>Payment Terms</b>", styles["Heading2"]))
    elements.append(Paragraph("Net 30 days from invoice date.", styles["Normal"]))
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("<b>Other Notes</b>", styles["Heading2"]))
    elements.append(
        Paragraph(
            "Goods are guaranteed against defects for 12 months. "
            "This quotation is valid for 30 days from the issue date.",
            styles["Normal"],
        )
    )
    elements.append(Spacer(1, 20))

    # Footer
    footer = Paragraph(
        "<i>This is a system-generated quotation for a supply contract and does not require signature.</i>",
        styles["Italic"],
    )
    elements.append(Spacer(1, 40))
    elements.append(footer)

    # Build PDF
    doc.build(elements)
