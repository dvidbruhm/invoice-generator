function calculateTotals(lineItems, settings) {
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.rate) * parseFloat(item.hours));
  }, 0);
  
  const tps = settings.taxTPS ? subtotal * settings.tpsRate : 0;
  const tvq = settings.taxTVQ ? (subtotal + tps) * settings.tvqRate : 0;
  const total = subtotal + tps + tvq;
  
  return { subtotal, tps, tvq, total };
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function addLogo(doc, logo, x, y, width, height) {
  if (logo && logo.startsWith('data:image')) {
    try {
      const format = logo.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(logo, format, x, y, width, height);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

function checkPageBreak(doc, y, neededSpace = 20) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  if (y + neededSpace > pageHeight - margin) {
    doc.addPage();
    return margin + 10;
  }
  return y;
}

function renderTemplate(doc, invoice, settings) {
  const { subtotal, tps, tvq, total } = calculateTotals(invoice.lineItems, settings);
  const accent = hexToRgb(settings.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  doc.setFont('helvetica');
  
  switch (settings.template) {
    case 'classic':
      renderClassic(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'modern':
      renderModern(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total);
      break;
    case 'clean':
      renderClean(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'bold':
      renderBold(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'elegant':
      renderElegant(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'compact':
      renderCompact(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'sidebar':
      renderSidebar(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total);
      break;
    case 'bordered':
      renderBordered(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'subtle':
      renderSubtle(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'stripe':
      renderStripe(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'grid':
      renderGrid(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'corner':
      renderCorner(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'executive':
      renderExecutive(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'minimal':
      renderMinimal(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'divider':
      renderDivider(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'dash':
      renderDash(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'swiss':
      renderSwiss(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total);
      break;
    case 'progiciels':
      renderProgiciels(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total);
      break;
    default:
      renderModern(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total);
  }
}

function renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y) {
  y = checkPageBreak(doc, y, 32);
  if (settings.logo) {
    addLogo(doc, settings.logo, margin, y, 18, 18);
    doc.setFontSize(16);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text(settings.companyName || 'Your Company', margin + 22, y + 10);
  } else {
    doc.setFontSize(16);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text(settings.companyName || 'Your Company', margin, y + 6);
  }

  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  let infoY = y + (settings.logo ? 18 : 12);
  if (settings.companyAddress) { doc.text(settings.companyAddress, margin, infoY); infoY += 3; }
  if (settings.companyEmail) { doc.text(settings.companyEmail, margin, infoY); infoY += 3; }
  if (settings.companyPhone) { doc.text(settings.companyPhone, margin, infoY); infoY += 3; }
  if (settings.companyWebsite) { doc.text(settings.companyWebsite, margin, infoY); infoY += 3; }

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(settings.labelInvoice || 'INVOICE', pageWidth - margin - 40, y + 6, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  let metaY = y + 12;
  doc.text(`${settings.labelInvoiceNumber || 'Invoice #'} ${invoice.number}`, pageWidth - margin, metaY, { align: 'right' }); metaY += 4;
  doc.text(`${settings.labelDate || 'Date'}: ${invoice.date}`, pageWidth - margin, metaY, { align: 'right' }); metaY += 4;
  doc.text(`${settings.labelDueDate || 'Due'}: ${invoice.dueDate}`, pageWidth - margin, metaY, { align: 'right' });

  return y + 32;
}

function renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y) {
  y = checkPageBreak(doc, y, 22);
  doc.setFontSize(8);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.labelBillTo || 'Bill To:', margin, y);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(invoice.clientName, margin, y + 4);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  let clientY = y + 9;
  if (invoice.clientAddress) { doc.text(invoice.clientAddress, margin, clientY); clientY += 3; }
  if (invoice.clientEmail) { doc.text(invoice.clientEmail, margin, clientY); clientY += 3; }

  return y + 18;
}

function renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y) {
  const colDescPct = settings.colDescription || 35;
  const colRatePct = settings.colRate || 15;
  const colHoursPct = settings.colHours || 15;
  const colAmountPct = settings.colAmount || 20;
  const totalPct = colDescPct + colRatePct + colHoursPct + colAmountPct;

  const descW = (colDescPct / totalPct) * contentWidth;
  const rateW = (colRatePct / totalPct) * contentWidth;
  const hoursW = (colHoursPct / totalPct) * contentWidth;
  const amountW = (colAmountPct / totalPct) * contentWidth;

  const colX = [
    margin,
    margin + descW,
    margin + descW + rateW,
    margin + descW + rateW + hoursW,
    margin + descW + rateW + hoursW + amountW
  ];

  const headers = [
    settings.labelDescription || 'Description',
    settings.labelRate || 'Rate',
    settings.labelHours || 'Hours',
    settings.labelAmount || 'Amount'
  ];
  const rowHeight = 8;
  const headerHeight = 7;
  const template = settings.template || 'modern';
  const isGrid = template === 'grid';
  const isClassic = template === 'classic';
  const isClean = template === 'clean';
  const isSidebar = template === 'sidebar';
  const isMinimalHeader = template === 'executive' || template === 'minimal' || template === 'divider' || template === 'dash' || template === 'swiss';

  function drawTableHeader(yPos) {
    if (isClassic) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(margin, yPos, margin + contentWidth, yPos);
      doc.setLineWidth(0.4);
      doc.line(margin, yPos + headerHeight + 1, margin + contentWidth, yPos + headerHeight + 1);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('times', 'bold');
    } else if (isClean) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + headerHeight + 1, margin + contentWidth, yPos + headerHeight + 1);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
    } else if (isMinimalHeader) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + headerHeight + 1, margin + contentWidth, yPos + headerHeight + 1);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
    } else {
      doc.setFillColor(accent.r, accent.g, accent.b);
      if (doc.roundedRect) {
        doc.roundedRect(margin, yPos, contentWidth, headerHeight, 2, 2, 'F');
      } else {
        doc.rect(margin, yPos, contentWidth, headerHeight, 'F');
      }
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
    }
    doc.text(headers[0], colX[0] + 2, yPos + 5);
    doc.text(headers[1], colX[1], yPos + 5);
    doc.text(headers[2], colX[2], yPos + 5);
    doc.text(headers[3], colX[3], yPos + 5);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    return yPos + headerHeight + 3;
  }

  let currentY = drawTableHeader(y);
  const tableStartY = y;

  invoice.lineItems.forEach((item, i) => {
    const amount = parseFloat(item.rate) * parseFloat(item.hours);
    doc.setFontSize(9);
    if (isClassic) doc.setFont('times', 'normal');
    const descLines = doc.splitTextToSize(item.description || '', colX[1] - colX[0] - 4);
    const lineCount = descLines.length || 1;
    const lineHeightMm = doc.getFontSize() * 0.3528 * 1.15;
    const descBlockHeight = lineCount * lineHeightMm;

    const dateFormat = settings.dateFormat || 'default';
    const datePosition = settings.datePosition || 'rotated';
    const dateText = item.date ? formatLineItemDate(item.date, dateFormat) : '';
    const dateLineHeight = 7 * 0.3528 * 1.15;
    const inlineGap = 1.2;
    const contentBlockHeight = (datePosition === 'inline' && dateText)
      ? descBlockHeight + dateLineHeight + inlineGap
      : descBlockHeight;
    const actualRowHeight = Math.max(rowHeight, contentBlockHeight + 3);

    currentY = checkPageBreak(doc, currentY, actualRowHeight + 2);
    if (currentY <= 35 && i > 0) {
      currentY = drawTableHeader(currentY);
    }

    const bgTop = currentY - 3;
    if (i % 2 === 0 && !isGrid && !isClassic) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, bgTop, contentWidth, actualRowHeight, 'F');
    }

    if (datePosition === 'rotated' && !isSidebar && dateText) {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      const textW = doc.getTextWidth(dateText);
      const anchorY = bgTop + actualRowHeight / 2 + textW / 2;
      doc.text(dateText, margin - 10, anchorY, { angle: 90 });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      if (isClassic) doc.setFont('times', 'normal');
    }

    const blockTop = bgTop + (actualRowHeight - contentBlockHeight) / 2;
    if (datePosition === 'inline' && dateText) {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(dateText, colX[0] + 2, blockTop + dateLineHeight * 0.75);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      if (isClassic) doc.setFont('times', 'normal');
      doc.text(descLines, colX[0] + 2, blockTop + dateLineHeight + inlineGap + lineHeightMm * 0.75);
    } else {
      doc.text(descLines, colX[0] + 2, blockTop + lineHeightMm * 0.75);
    }

    const fontHeight = doc.getFontSize() * 0.3528;
    const otherBaseline = bgTop + actualRowHeight / 2 + fontHeight * 0.3;
    doc.text(formatCurrency(parseFloat(item.rate), settings.currency), colX[1], otherBaseline);
    doc.text(item.hours, colX[2], otherBaseline);
    doc.text(formatCurrency(amount, settings.currency), colX[3], otherBaseline, { align: 'right' });
    currentY += actualRowHeight;
  });

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  if (isClassic) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
  }
  doc.line(margin, tableStartY, margin + contentWidth, tableStartY);
  doc.line(margin, currentY - 2, margin + contentWidth, currentY - 2);

  if (isGrid) {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    for (const x of colX) {
      doc.line(x, tableStartY, x, currentY - 2);
    }
    doc.line(margin + contentWidth, tableStartY, margin + contentWidth, currentY - 2);
    doc.line(margin, tableStartY, margin, currentY - 2);
  }

  return currentY + 5;
}

function renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total) {
  y = checkPageBreak(doc, y, 35);
  const totalsX = margin + contentWidth - 70;
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${settings.labelSubtotal || 'Subtotal'}:`, totalsX, y);
  doc.text(formatCurrency(subtotal, settings.currency), margin + contentWidth, y, { align: 'right' });
  y += 6;
  
  if (settings.taxTPS) {
    doc.text(`${settings.labelTPS || 'TPS'} (${(settings.tpsRate * 100).toFixed(1)}%):`, totalsX, y);
    doc.text(formatCurrency(tps, settings.currency), margin + contentWidth, y, { align: 'right' });
    y += 6;
  }
  
  if (settings.taxTVQ) {
    doc.text(`${settings.labelTVQ || 'TVQ'} (${(settings.tvqRate * 100).toFixed(2)}%):`, totalsX, y);
    doc.text(formatCurrency(tvq, settings.currency), margin + contentWidth, y, { align: 'right' });
    y += 6;
  }
  
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(1);
  doc.line(totalsX - 5, y, margin + contentWidth, y);
  y += 7;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(`${settings.labelTotal || 'Total'}:`, totalsX, y);
  doc.text(formatCurrency(total, settings.currency), margin + contentWidth, y, { align: 'right' });
  
  return y + 15;
}

function renderFooter(doc, settings, accent, margin, contentWidth, y, pageHeight, pageWidth) {
  y = checkPageBreak(doc, y, 30);
  if (settings.notes || settings.paymentTerms) {
    y += 10;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 8;
    
    doc.setFontSize(8);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.setFont(undefined, 'bold');
    doc.text(settings.labelNotes || 'Notes', margin, y);
    y += 5;
    
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    if (settings.paymentTerms) {
      doc.text(`${settings.labelPaymentTerms || 'Payment Terms'}: ${settings.paymentTerms}`, margin, y);
      y += 4;
    }
    if (settings.notes) {
      const splitNotes = doc.splitTextToSize(settings.notes, contentWidth - 10);
      doc.text(splitNotes, margin, y);
    }
  }
  
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated by Invoice Generator`, pageWidth / 2, pageHeight - 10, { align: 'center' });
}

function renderClassic(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 18;
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + contentWidth, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 2, margin + contentWidth, y + 2);

  y += 6;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderModern(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total) {
  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(0, -3, pageWidth, 11, 3, 3, 'F');
  } else {
    doc.rect(0, 0, pageWidth, 8, 'F');
  }

  let y = 16;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, pageHeight, pageWidth);
}

function renderClean(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 18;
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.ellipse(margin + contentWidth / 2, y + 2, 1.2, 1.2, 'F');

  y += 6;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderBold(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 16;
  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'F');
  } else {
    doc.rect(margin, y, contentWidth, 28, 'F');
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(settings.companyName || 'Your Company', margin + 5, y + 11);

  doc.setFontSize(9);
  doc.text(`${settings.labelInvoiceNumber || 'Invoice #'} ${invoice.number}`, pageWidth - margin - 5, y + 11, { align: 'right' });

  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  doc.text(`${settings.labelDate || 'Date'}: ${invoice.date} | ${settings.labelDueDate || 'Due'}: ${invoice.dueDate}`, pageWidth - margin - 5, y + 20, { align: 'right' });

  y += 36;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderElegant(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 18;
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 50, y);

  doc.line(margin + 55, y + 3, margin + contentWidth, y + 3);

  doc.setFillColor(accent.r, accent.g, accent.b);
  const diamondSize = 1.5;
  doc.triangle(margin + 25, y - diamondSize, margin + 25 + diamondSize, y, margin + 25, y + diamondSize, 'F');
  doc.triangle(margin + 25, y - diamondSize, margin + 25 - diamondSize, y, margin + 25, y + diamondSize, 'F');

  y += 6;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderCompact(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 12;
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 7, margin + contentWidth, y + 7);

  doc.setFontSize(12);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 5);

  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(pageWidth - margin - 24, y, 24, 7, 2, 2, 'F');
  } else {
    doc.rect(pageWidth - margin - 24, y, 24, 7, 'F');
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text('INVOICE', pageWidth - margin - 12, y + 5, { align: 'center' });

  y += 12;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderSidebar(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total) {
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(0, 0, 45, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  const compName = settings.companyName || 'Your Company';
  doc.text(compName, 22, 22, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  let sidebarY = 32;
  if (settings.companyAddress) { doc.text(settings.companyAddress, 22, sidebarY, { align: 'center' }); sidebarY += 3.5; }
  if (settings.companyEmail) { doc.text(settings.companyEmail, 22, sidebarY, { align: 'center' }); sidebarY += 3.5; }
  if (settings.companyPhone) { doc.text(settings.companyPhone, 22, sidebarY, { align: 'center' }); sidebarY += 3.5; }
  if (settings.companyWebsite) { doc.text(settings.companyWebsite, 22, sidebarY, { align: 'center' }); sidebarY += 3.5; }

  const sideMargin = 55;
  const sideWidth = pageWidth - sideMargin - margin;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(settings.labelInvoice || 'INVOICE', sideMargin, 18);

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${settings.labelInvoiceNumber || 'Invoice #'} ${invoice.number}`, sideMargin, 26);
  doc.text(`${settings.labelDate || 'Date'}: ${invoice.date}`, sideMargin, 31);
  doc.text(`${settings.labelDueDate || 'Due'}: ${invoice.dueDate}`, sideMargin, 36);

  let y = 44;
  y = renderClientSection(doc, invoice, settings, accent, sideMargin, sideWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, sideMargin, sideWidth, y);
  y = renderTotals(doc, settings, accent, sideMargin, sideWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, sideMargin, sideWidth, y, pageHeight, pageWidth);
}

function renderBordered(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(1.5);
  if (doc.roundedRect) {
    doc.roundedRect(margin - 3, 10, contentWidth + 6, pageH - 20, 3, 3, 'S');
  } else {
    doc.rect(margin - 3, 10, contentWidth + 6, pageH - 20, 'S');
  }

  doc.setFillColor(accent.r, accent.g, accent.b);
  const dotR = 1.5;
  doc.ellipse(margin, 10, dotR, dotR, 'F');
  doc.ellipse(margin + contentWidth, 10, dotR, dotR, 'F');
  doc.ellipse(margin, pageH - 10, dotR, dotR, 'F');
  doc.ellipse(margin + contentWidth, pageH - 10, dotR, dotR, 'F');

  let y = 20;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, pageH, pageWidth);
}

function renderSubtle(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 18;
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + 35, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 1.5, margin + 50, y + 1.5);

  y += 4;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderStripe(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 14;
  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(0, y, pageWidth, 3, 1.5, 1.5, 'F');
  } else {
    doc.rect(0, y, pageWidth, 3, 'F');
  }
  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(0, y + 5, pageWidth, 0.8, 0.4, 0.4, 'F');
  } else {
    doc.rect(0, y + 5, pageWidth, 0.8, 'F');
  }

  y += 11;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderGrid(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 20;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  } else {
    doc.rect(margin, y, contentWidth, 12, 'F');
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(settings.companyName || 'Your Company', margin + 5, y + 8);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.text(`${settings.labelInvoiceNumber || 'Invoice #'} ${invoice.number}`, pageWidth - margin - 5, y + 8, { align: 'right' });

  y += 18;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderCorner(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.triangle(pageWidth - 45, 0, pageWidth, 0, pageWidth, 45, 'F');

  doc.setFillColor(Math.min(255, accent.r + 60), Math.min(255, accent.g + 60), Math.min(255, accent.b + 60));
  doc.triangle(pageWidth - 30, 0, pageWidth, 0, pageWidth, 30, 'F');

  let y = 18;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderExecutive(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(0, 0, pageWidth, 1.5, 'F');

  let y = 16;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderMinimal(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 18;
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(margin, y, 8, 1.5, 'F');

  y += 5;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderDivider(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 18;
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(0.7);
  doc.line(margin, y, margin + contentWidth, y);

  y += 4;
  doc.setDrawColor(
    Math.round(accent.r * 0.4 + 255 * 0.6),
    Math.round(accent.g * 0.4 + 255 * 0.6),
    Math.round(accent.b * 0.4 + 255 * 0.6)
  );
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth * 0.4, y);
  doc.setDrawColor(accent.r, accent.g, accent.b);

  y += 6;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderDash(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(margin, 18, 1.5, 8, 'F');

  let y = 16;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderSwiss(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 18;
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(margin, y, 3, 3, 'F');

  y += 5;
  doc.setDrawColor(
    Math.round(accent.r * 0.6 + 255 * 0.4),
    Math.round(accent.g * 0.6 + 255 * 0.4),
    Math.round(accent.b * 0.6 + 255 * 0.4)
  );
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  doc.setDrawColor(accent.r, accent.g, accent.b);

  y += 6;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderProgiciels(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total) {
  const { formatCurrency } = window;
  let y = 20;

  // Light accent color for boxes (blend accent with white ~90%)
  const lightR = Math.min(255, Math.round(accent.r + (255 - accent.r) * 0.9));
  const lightG = Math.min(255, Math.round(accent.g + (255 - accent.g) * 0.9));
  const lightB = Math.min(255, Math.round(accent.b + (255 - accent.b) * 0.9));

  // --- Left blue sidebar ---
  const sidebarWidth = 6;
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(0, 3, sidebarWidth, pageHeight - 6, 'F');

  // --- Centered "F A C T U R E" title (black, letter-spaced) ---
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  const titleText = (settings.labelInvoice || 'FACTURE').split('').join(' ');
  doc.text(titleText, pageWidth / 2, y, { align: 'center' });
  doc.setFont(undefined, 'normal');
  y += 6;

  // --- Gray horizontal line under title ---
  doc.setDrawColor(136, 136, 136);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // --- Two-column header: company info left, client box right ---
  const clientBoxWidth = Math.min(62, contentWidth * 0.37);
  const clientBoxX = margin + contentWidth - clientBoxWidth;
  const clientBoxY = y;
  const clientBoxHeight = 30;

  // Company info (left side)
  if (settings.logo) {
    addLogo(doc, settings.logo, margin, y, 12, 12);
    doc.setFontSize(14);
    doc.setTextColor(28, 37, 44);
    doc.text(settings.companyName || 'Your Company', margin + 15, y + 7);
  } else {
    doc.setFontSize(14);
    doc.setTextColor(28, 37, 44);
    doc.text(settings.companyName || 'Your Company', margin, y + 4);
  }
  let infoY = y + (settings.logo ? 14 : 10);
  doc.setFontSize(8);
  doc.setTextColor(28, 37, 44);
  if (settings.companyPhone) { doc.text(settings.companyPhone, margin, infoY); infoY += 3.5; }
  if (settings.companyEmail) { doc.text(settings.companyEmail, margin, infoY); infoY += 3.5; }
  if (settings.companyWebsite) { doc.text(settings.companyWebsite, margin, infoY); infoY += 3.5; }
  if (settings.companyAddress) {
    const leftWidth = clientBoxX - margin - 8;
    const addrLines = doc.splitTextToSize(settings.companyAddress, leftWidth);
    addrLines.forEach(line => { doc.text(line, margin, infoY); infoY += 3.5; });
  }

  // Client info box (right side) - light accent background
  doc.setFillColor(lightR, lightG, lightB);
  if (doc.roundedRect) {
    doc.roundedRect(clientBoxX, clientBoxY, clientBoxWidth, clientBoxHeight, 2, 2, 'F');
  } else {
    doc.rect(clientBoxX, clientBoxY, clientBoxWidth, clientBoxHeight, 'F');
  }
  let clientTextY = clientBoxY + 5;
  doc.setFontSize(7);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.setFont(undefined, 'bold');
  doc.text(settings.labelBillTo || 'FACTURÉ À:', clientBoxX + 3, clientTextY);
  clientTextY += 5;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.clientName || '', clientBoxX + 3, clientTextY);
  clientTextY += 4;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  if (invoice.clientEmail) { doc.text(invoice.clientEmail, clientBoxX + 3, clientTextY); clientTextY += 3; }
  if (invoice.clientAddress) {
    const clientAddrLines = doc.splitTextToSize(invoice.clientAddress, clientBoxWidth - 6);
    clientAddrLines.slice(0, 2).forEach(line => { doc.text(line, clientBoxX + 3, clientTextY); clientTextY += 3; });
  }

  y = clientBoxY + clientBoxHeight + 8;

  // --- Details bar between two gray lines ---
  const amountBoxWidth = Math.min(45, contentWidth * 0.27);
  const amountBoxX = margin + contentWidth - amountBoxWidth;
  const barHeight = 20;
  const barTop = y;

  // Top gray line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, barTop, margin + contentWidth, barTop);

  // Light accent box for Montant on the right
  doc.setFillColor(lightR, lightG, lightB);
  if (doc.roundedRect) {
    doc.roundedRect(amountBoxX, barTop, amountBoxWidth, barHeight, 2, 2, 'F');
  } else {
    doc.rect(amountBoxX, barTop, amountBoxWidth, barHeight, 'F');
  }

  // Invoice detail labels and values
  const colW = (amountBoxX - margin) / 3;
  let labelY = barTop + 6;
  let valueY = barTop + 15;

  // Facture #
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'bold');
  doc.text(`${settings.labelInvoiceNumber || 'Facture #'}:`, margin + 2, labelY);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.number || '', margin + 2, valueY);

  // Date
  const dateX = margin + colW;
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text(`${settings.labelDate || 'Date'}:`, dateX, labelY);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.date || '', dateX, valueY);

  // Échéance
  const dueX = margin + colW * 2;
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'bold');
  doc.text(`${settings.labelDueDate || 'Échéance'}:`, dueX, labelY);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.dueDate || '', dueX, valueY);

  // Montant (in light blue box)
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text(`${settings.labelTotal || 'Montant'}:`, amountBoxX + 3, labelY);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(formatCurrency(total, settings.currency), amountBoxX + amountBoxWidth - 3, valueY, { align: 'right' });
  doc.setFont(undefined, 'normal');

  y = barTop + barHeight + 2;

  // Bottom gray line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 10;

  // --- Custom line items table ---
  const colDescPct = settings.colDescription || 50;
  const colHoursPct = settings.colHours || 15;
  const colRatePct = settings.colRate || 15;
  const colAmountPct = settings.colAmount || 20;
  const totalPct = colDescPct + colHoursPct + colRatePct + colAmountPct;

  const descW = (colDescPct / totalPct) * contentWidth;
  const hoursW = (colHoursPct / totalPct) * contentWidth;
  const rateW = (colRatePct / totalPct) * contentWidth;
  const amountW = (colAmountPct / totalPct) * contentWidth;

  const colX = [
    margin,
    margin + descW,
    margin + descW + hoursW,
    margin + descW + hoursW + rateW,
    margin + descW + hoursW + rateW + amountW
  ];

  const headers = [
    settings.labelDescription || 'Description',
    settings.labelHours || 'Nombre d\'heures',
    settings.labelRate || 'Taux',
    settings.labelAmount || 'Montant'
  ];

  const headerHeight = 7;
  const rowHeight = 8;

  // Table header - plain bold text with thick bottom border (no colored background)
  y = checkPageBreak(doc, y, headerHeight + 5);
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(headers[0], colX[0] + 2, y + 5);
  doc.text(headers[1], colX[1] + hoursW / 2, y + 5, { align: 'center' });
  doc.text(headers[2], colX[2] + rateW / 2, y + 5, { align: 'center' });
  doc.text(headers[3], colX[3] + amountW / 2, y + 5, { align: 'center' });
  doc.setFont(undefined, 'normal');

  // Thick bottom border for header
  const tableTop = y;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, y + headerHeight + 1, margin + contentWidth, y + headerHeight + 1);
  y += headerHeight + 3;

  // Line items rows
  const dateFormat = settings.dateFormat || 'default';
  const datePosition = settings.datePosition || 'rotated';

  invoice.lineItems.forEach((item, i) => {
    const amount = parseFloat(item.rate) * parseFloat(item.hours);
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(item.description || '', colX[1] - colX[0] - 4);
    const lineCount = descLines.length || 1;
    const lineHeightMm = doc.getFontSize() * 0.3528 * 1.15;
    const descBlockHeight = lineCount * lineHeightMm;
    const dateText = item.date ? formatLineItemDate(item.date, dateFormat) : '';
    const dateLineHeight = 7 * 0.3528 * 1.15;
    const inlineGap = 1.2;
    const contentBlockHeight = (datePosition === 'inline' && dateText)
      ? descBlockHeight + dateLineHeight + inlineGap
      : descBlockHeight;
    const actualRowHeight = Math.max(rowHeight, contentBlockHeight + 3);

    y = checkPageBreak(doc, y, actualRowHeight + 2);
    if (y <= 35 && i > 0) {
      // Re-draw table header on new page
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(headers[0], colX[0] + 2, y + 5);
      doc.text(headers[1], colX[1] + hoursW / 2, y + 5, { align: 'center' });
      doc.text(headers[2], colX[2] + rateW / 2, y + 5, { align: 'center' });
      doc.text(headers[3], colX[3] + amountW / 2, y + 5, { align: 'center' });
      doc.setFont(undefined, 'normal');
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.8);
      doc.line(margin, y + headerHeight + 1, margin + contentWidth, y + headerHeight + 1);
      y += headerHeight + 3;
    }

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, y - 1, contentWidth, actualRowHeight, 'F');
    }

    // Description text
    const blockTop = y;
    if (datePosition === 'inline' && dateText) {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(dateText, colX[0] + 2, blockTop + dateLineHeight * 0.75);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.text(descLines, colX[0] + 2, blockTop + dateLineHeight + inlineGap + lineHeightMm * 0.75);
    } else {
      doc.text(descLines, colX[0] + 2, blockTop + lineHeightMm * 0.75);
    }

    // Numeric values (centered)
    const fontHeight = doc.getFontSize() * 0.3528;
    const otherBaseline = y + actualRowHeight / 2 + fontHeight * 0.3;
    doc.text(item.hours || '', colX[1] + hoursW / 2, otherBaseline, { align: 'center' });
    doc.text(formatCurrency(parseFloat(item.rate) || 0, settings.currency), colX[2] + rateW / 2, otherBaseline, { align: 'center' });
    doc.text(formatCurrency(amount, settings.currency), colX[3] + amountW - 2, otherBaseline, { align: 'right' });

    // Thin row separator
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y + actualRowHeight - 1, margin + contentWidth, y + actualRowHeight - 1);
    y += actualRowHeight;
  });

  // Thick bottom border for table
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, y, margin + contentWidth, y);
  y += 10;

  // --- Notes section (before totals, with ">" prefix) ---
  if (invoice.notes) {
    y = checkPageBreak(doc, y, 15);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(settings.labelNotes || 'NOTES', margin, y);
    doc.setFont(undefined, 'normal');
    y += 5;
    doc.setFontSize(7);
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth - 10);
    noteLines.forEach(line => {
      y = checkPageBreak(doc, y, 4);
      doc.setTextColor(160, 160, 160);
      doc.text('>', margin, y);
      doc.setTextColor(100, 100, 100);
      doc.text(line, margin + 5, y);
      y += 3.5;
    });
    y += 5;
  }

  // --- Totals section ---
  y = checkPageBreak(doc, y, 40);

  // Gray separator line before totals
  doc.setDrawColor(136, 136, 136);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 8;

  const totalsX = margin + contentWidth - 65;

  // SOUS-TOTAL (bold label)
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(`${settings.labelSubtotal || 'SOUS-TOTAL'}:`, totalsX, y);
  doc.text(formatCurrency(subtotal, settings.currency), margin + contentWidth, y, { align: 'right' });
  doc.setFont(undefined, 'normal');
  y += 6;

  // TPS
  if (settings.taxTPS) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${settings.labelTPS || 'TPS'} (${(settings.tpsRate * 100).toFixed(1)}%):`, totalsX, y);
    doc.text(formatCurrency(tps, settings.currency), margin + contentWidth, y, { align: 'right' });
    y += 6;
  }

  // TVQ
  if (settings.taxTVQ) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${settings.labelTVQ || 'TVQ'} (${(settings.tvqRate * 100).toFixed(2)}%):`, totalsX, y);
    doc.text(formatCurrency(tvq, settings.currency), margin + contentWidth, y, { align: 'right' });
    y += 6;
  }

  // Gray separator before TOTAL
  doc.setDrawColor(136, 136, 136);
  doc.setLineWidth(0.4);
  doc.line(totalsX - 5, y, margin + contentWidth, y);
  y += 8;

  // TOTAL (bold, accent color)
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`${settings.labelTotal || 'TOTAL'}:`, totalsX, y);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(formatCurrency(total, settings.currency), margin + contentWidth, y, { align: 'right' });
  doc.setFont(undefined, 'normal');

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by Invoice Generator', pageWidth / 2, pageHeight - 10, { align: 'center' });
}

async function generatePDF(invoice, settings) {
  if (!window.jspdf) {
    throw new Error('jsPDF library not loaded. Please check your internet connection and reload the page.');
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });
  
  renderTemplate(doc, invoice, settings);
  
  const filename = `${invoice.number}.pdf`;
  doc.save(filename);
}

function sharpenCanvas(canvas, amount) {
  var w = canvas.width;
  var h = canvas.height;
  var ctx = canvas.getContext('2d');
  var imageData = ctx.getImageData(0, 0, w, h);
  var src = imageData.data;

  var output = ctx.createImageData(w, h);
  var dst = output.data;

  var a = -amount;
  var k = a * 4 + 1;

  for (var y = 1; y < h - 1; y++) {
    for (var x = 1; x < w - 1; x++) {
      var idx = (y * w + x) * 4;
      for (var c = 0; c < 3; c++) {
        var val = k * src[idx + c]
          + a * src[((y - 1) * w + x) * 4 + c]
          + a * src[((y + 1) * w + x) * 4 + c]
          + a * src[(y * w + x - 1) * 4 + c]
          + a * src[(y * w + x + 1) * 4 + c];
        dst[idx + c] = val < 0 ? 0 : val > 255 ? 255 : val;
      }
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
  return canvas;
}

async function generatePDFViaServer(elementId, filename) {
  var element = document.getElementById(elementId);
  if (!element) throw new Error('Preview element not found.');

  var clone = element.cloneNode(true);
  clone.id = 'visual-pdf-clone';
  clone.style.width = '794px';
  clone.style.padding = '40px';
  clone.style.background = 'white';
  clone.style.color = '#111';

  var style = document.createElement('style');
  style.textContent = Array.from(document.styleSheets)
    .flatMap(function(sheet) {
      try { return Array.from(sheet.cssRules).map(function(r) { return r.cssText; }); }
      catch (e) { return []; }
    })
    .join('\n');
  clone.insertBefore(style, clone.firstChild);

  var html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;">' + clone.outerHTML + '</body></html>';

  var resp = await fetch('/api/pdf/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: html })
  });

  if (!resp.ok) throw new Error('Server PDF failed');

  var blob = await resp.blob();
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename + '.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function generatePDFFromHTML(elementId, filename) {
  try {
    await generatePDFViaServer(elementId, filename);
    return;
  } catch (serverErr) {
    console.warn('Server PDF generation failed, falling back to html2canvas:', serverErr);
  }

  if (!window.html2canvas) {
    throw new Error('html2canvas library not loaded. Please check your internet connection and reload the page.');
  }
  if (!window.jspdf) {
    throw new Error('jsPDF library not loaded. Please check your internet connection and reload the page.');
  }

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Preview element not found.');
  }

  const clone = element.cloneNode(true);
  clone.id = 'visual-pdf-clone';
  clone.style.width = '794px';
  clone.style.padding = '40px';
  clone.style.background = 'white';
  clone.style.color = '#111';
  clone.style.webkitFontSmoothing = 'antialiased';
  clone.style.textRendering = 'optimizeLegibility';
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  document.body.appendChild(clone);

  try {
    var rawCanvas = await html2canvas(clone, {
      scale: 4,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    sharpenCanvas(rawCanvas, 0.3);
    var canvas = rawCanvas;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let position = 0;

    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(`${filename}.pdf`);
  } finally {
    const cloneEl = document.getElementById('visual-pdf-clone');
    if (cloneEl) cloneEl.remove();
  }
}
