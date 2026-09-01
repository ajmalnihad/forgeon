"""
Server-side PDF report generation (ReportLab).

Produces a clean, professional MVP sales report:
  header + date range, summary block, top products, top customers,
  generated-at line.

The SAME report_service filter/aggregation functions are reused — there is
no second interpretation of filters inside this module.
"""
import io
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from services.report_service import (
    get_report_summary,
    get_top_customers,
    get_top_products,
)

BRAND = "#E2590A"
DARK = "#17171B"
GREY = "#6B6B76"
LIGHT_GREY = "#F4F4F6"


def _fmt_money(value) -> str:
    """Format a Decimal/str money value as INR."""
    try:
        amount = float(str(value))
    except (TypeError, ValueError):
        return "₹0.00"
    return f"₹{amount:,.2f}"


def build_sales_report_pdf(
    date_from=None,
    date_to=None,
    customer=None,
    payment_status=None,
    product=None,
) -> bytes:
    summary = get_report_summary(
        date_from=date_from,
        date_to=date_to,
        customer=customer,
        payment_status=payment_status,
        product=product,
    )
    top_products = get_top_products(
        date_from=date_from,
        date_to=date_to,
        customer=customer,
        payment_status=payment_status,
        product=product,
        limit=5,
    )
    top_customers = get_top_customers(
        date_from=date_from,
        date_to=date_to,
        customer=customer,
        payment_status=payment_status,
        product=product,
        limit=5,
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleX",
        parent=styles["Title"],
        textColor=DARK,
        fontSize=20,
        spaceAfter=2,
    )
    subtitle_style = ParagraphStyle(
        "SubtitleX",
        parent=styles["Normal"],
        textColor=GREY,
        fontSize=10,
        spaceAfter=10,
    )
    section_style = ParagraphStyle(
        "SectionX",
        parent=styles["Heading2"],
        textColor=BRAND,
        fontSize=13,
        spaceBefore=14,
        spaceAfter=6,
    )

    elements = []
    elements.append(Paragraph("ForgeON Sales Report", title_style))
    elements.append(Paragraph("Company Sales &amp; Customer Loyalty Management System", subtitle_style))
    elements.append(
        Paragraph(
            f"Date Range: {date_from or 'start'} → {date_to or 'today'}"
            f"&nbsp;&nbsp;|&nbsp;&nbsp;Generated: "
            f"{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
            subtitle_style,
        )
    )

    # Summary block
    elements.append(Paragraph("Summary", section_style))
    summary_rows = [
        ["Sales Count", str(summary["salesCount"])],
        ["Total Sales", _fmt_money(summary["totalSales"])],
        ["Total Cost", _fmt_money(summary["totalCost"])],
        ["Total Profit", _fmt_money(summary["totalProfit"])],
        ["Paid Amount", _fmt_money(summary["paidAmount"])],
        ["Pending Amount", _fmt_money(summary["pendingAmount"])],
        ["Pending Count", str(summary["pendingCount"])],
    ]
    summary_table = Table(summary_rows, colWidths=[70 * mm, 50 * mm])
    summary_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 0), (-1, -1), DARK),
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GREY),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCCCCC")),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, LIGHT_GREY]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(summary_table)

    # Top products
    elements.append(Paragraph("Top Products", section_style))
    if top_products:
        product_table_data = [["Product", "Qty", "Revenue", "Profit"]]
        for p in top_products:
            product_table_data.append(
                [
                    p["productName"],
                    str(p["quantity"]),
                    _fmt_money(p["revenue"]),
                    _fmt_money(p["profit"]),
                ]
            )
        product_table = Table(product_table_data, colWidths=[70 * mm, 20 * mm, 25 * mm, 25 * mm])
        product_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BACKGROUND", (0, 0), (-1, 0), BRAND),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCCCCC")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREY]),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(product_table)
    else:
        elements.append(Paragraph("No product sales in this range.", subtitle_style))

    # Top customers
    elements.append(Paragraph("Top Customers", section_style))
    if top_customers:
        customer_table_data = [["Customer", "Code", "Sales", "Purchases"]]
        for c in top_customers:
            customer_table_data.append(
                [
                    c["name"],
                    c["code"],
                    _fmt_money(c["total"]),
                    str(c["purchases"]),
                ]
            )
        customer_table = Table(customer_table_data, colWidths=[55 * mm, 30 * mm, 30 * mm, 25 * mm])
        customer_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("BACKGROUND", (0, 0), (-1, 0), BRAND),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCCCCC")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREY]),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(customer_table)
    else:
        elements.append(Paragraph("No customer activity in this range.", subtitle_style))

    elements.append(Spacer(1, 8 * mm))
    elements.append(
        Paragraph(
            "Confidential — internal use only. Generated by the ForgeON backend.",
            subtitle_style,
        )
    )

    doc.build(elements)
    return buffer.getvalue()
