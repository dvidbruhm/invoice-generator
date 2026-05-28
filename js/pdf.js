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
  doc.setFont('times');

  doc.setFontSize(18);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 6);

  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(1);
  doc.line(margin, y + 10, margin + contentWidth, y + 10);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 12, margin + contentWidth, y + 12);

  y += 16;

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  let metaY = y;
  if (settings.companyAddress) { doc.text(settings.companyAddress, margin, metaY); metaY += 3; }
  if (settings.companyEmail) { doc.text(settings.companyEmail, margin, metaY); metaY += 3; }
  if (settings.companyPhone) { doc.text(settings.companyPhone, margin, metaY); metaY += 3; }

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(settings.labelInvoice || 'INVOICE', pageWidth - margin - 40, y + 3, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  let rightY = y + 8;
  doc.text(`${settings.labelInvoiceNumber || 'Invoice #'} ${invoice.number}`, pageWidth - margin, rightY, { align: 'right' }); rightY += 4;
  doc.text(`${settings.labelDate || 'Date'}: ${invoice.date}`, pageWidth - margin, rightY, { align: 'right' }); rightY += 4;
  doc.text(`${settings.labelDueDate || 'Due'}: ${invoice.dueDate}`, pageWidth - margin, rightY, { align: 'right' });

  y = Math.max(metaY, rightY) + 6;
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
  doc.setFontSize(18);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 6);

  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.ellipse(margin + contentWidth / 2, y + 11, 1.2, 1.2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('INVOICE', pageWidth - margin, y + 6, { align: 'right' });

  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y + 14);
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
  doc.text(`#${invoice.number}`, pageWidth - margin - 5, y + 11, { align: 'right' });

  doc.setFont(undefined, 'normal');
  doc.setFontSize(7);
  doc.text(`Date: ${invoice.date} | Due: ${invoice.dueDate}`, pageWidth - margin - 5, y + 20, { align: 'right' });

  y += 36;
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

  doc.setFontSize(16);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 6);

  doc.line(margin + 55, y + 3, margin + contentWidth, y + 3);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice ${invoice.number}`, pageWidth - margin, y + 6, { align: 'right' });

  doc.setFillColor(accent.r, accent.g, accent.b);
  const diamondSize = 1.5;
  const diamondY = y + 11;
  doc.triangle(margin + 25, diamondY - diamondSize, margin + 25 + diamondSize, diamondY, margin + 25, diamondY + diamondSize, 'F');
  doc.triangle(margin + 25, diamondY - diamondSize, margin + 25 - diamondSize, diamondY, margin + 25, diamondY + diamondSize, 'F');

  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y + 16);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderCompact(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 12;
  doc.setFontSize(12);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(`${settings.companyName || 'Your Company'}`, margin, y + 5);

  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(pageWidth - margin - 24, y, 24, 7, 2, 2, 'F');
  } else {
    doc.rect(pageWidth - margin - 24, y, 24, 7, 'F');
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.text('INVOICE', pageWidth - margin - 12, y + 5, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`#${invoice.number} | ${invoice.date} | Due: ${invoice.dueDate} | ${invoice.clientName}`, margin, y + 12);

  y += 18;
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
  doc.text('INVOICE', sideMargin, 18);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`#${invoice.number}`, sideMargin, 26);
  doc.text(`Date: ${invoice.date}`, sideMargin, 31);
  doc.text(`Due: ${invoice.dueDate}`, sideMargin, 36);

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
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.text(settings.companyName || 'Your Company', margin, y + 5);

  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 9, margin + 35, y + 9);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 10.5, margin + 50, y + 10.5);

  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Invoice #${invoice.number}`, pageWidth - margin, y + 5, { align: 'right' });

  y += 16;
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

  doc.setFontSize(14);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 5);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice #${invoice.number}`, pageWidth - margin, y + 5, { align: 'right' });

  y += 14;
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
  doc.text(settings.companyName || 'Your Company', margin + 5, y + 8);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`#${invoice.number}`, pageWidth - margin - 5, y + 8, { align: 'right' });

  y += 18;
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

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(`#${invoice.number}`, pageWidth - 10, 14, { angle: 45 });

  let y = 20;
  doc.setFontSize(16);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 5);

  y += 14;
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
