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
    default:
      renderModern(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total);
  }
}

function renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y) {
  y = checkPageBreak(doc, y, 45);
  if (settings.logo) {
    addLogo(doc, settings.logo, margin, y, 25, 25);
    doc.setFontSize(18);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text(settings.companyName || 'Your Company', margin + 30, y + 12);
  } else {
    doc.setFontSize(20);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.text(settings.companyName || 'Your Company', margin, y + 8);
  }
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  let infoY = y + (settings.logo ? 22 : 16);
  if (settings.companyAddress) { doc.text(settings.companyAddress, margin, infoY); infoY += 4; }
  if (settings.companyEmail) { doc.text(settings.companyEmail, margin, infoY); infoY += 4; }
  if (settings.companyPhone) { doc.text(settings.companyPhone, margin, infoY); infoY += 4; }
  if (settings.companyWebsite) { doc.text(settings.companyWebsite, margin, infoY); infoY += 4; }
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(settings.labelInvoice || 'INVOICE', pageWidth - margin - 40, y + 8, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  let metaY = y + 16;
  doc.text(`${settings.labelInvoiceNumber || 'Invoice #'} ${invoice.number}`, pageWidth - margin, metaY, { align: 'right' }); metaY += 5;
  doc.text(`${settings.labelDate || 'Date'}: ${invoice.date}`, pageWidth - margin, metaY, { align: 'right' }); metaY += 5;
  doc.text(`${settings.labelDueDate || 'Due'}: ${invoice.dueDate}`, pageWidth - margin, metaY, { align: 'right' });
  
  return y + 45;
}

function renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y) {
  y = checkPageBreak(doc, y, 30);
  doc.setFontSize(10);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.labelBillTo || 'Bill To:', margin, y);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(invoice.clientName, margin, y + 6);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  let clientY = y + 12;
  if (invoice.clientAddress) { doc.text(invoice.clientAddress, margin, clientY); clientY += 4; }
  if (invoice.clientEmail) { doc.text(invoice.clientEmail, margin, clientY); clientY += 4; }
  
  return y + 25;
}

function renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y) {
  const colX = [margin, margin + 80, margin + 110, margin + 140, margin + 170];
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
    } else {
      doc.setFillColor(accent.r, accent.g, accent.b);
      doc.rect(margin, yPos, contentWidth, headerHeight, 'F');
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
    currentY = checkPageBreak(doc, currentY, rowHeight + 2);
    if (currentY <= 35 && i > 0) {
      currentY = drawTableHeader(currentY);
    }

    if (i % 2 === 0 && !isGrid && !isClassic) {
      doc.setFillColor(248, 248, 248);
      doc.rect(margin, currentY - 3, contentWidth, rowHeight, 'F');
    }

    doc.setFontSize(9);
    if (isClassic) doc.setFont('times', 'normal');
    doc.text(item.description, colX[0] + 2, currentY);
    doc.text(formatCurrency(parseFloat(item.rate), settings.currency), colX[1], currentY);
    doc.text(item.hours, colX[2], currentY);
    doc.text(formatCurrency(amount, settings.currency), colX[3], currentY, { align: 'right' });
    currentY += rowHeight;
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
  let y = 22;
  doc.setFont('times');

  doc.setFontSize(20);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 8);

  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(1.2);
  doc.line(margin, y + 12, margin + contentWidth, y + 12);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 14.5, margin + contentWidth, y + 14.5);

  y += 22;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  let metaY = y;
  if (settings.companyAddress) { doc.text(settings.companyAddress, margin, metaY); metaY += 4; }
  if (settings.companyEmail) { doc.text(settings.companyEmail, margin, metaY); metaY += 4; }
  if (settings.companyPhone) { doc.text(settings.companyPhone, margin, metaY); metaY += 4; }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(settings.labelInvoice || 'INVOICE', pageWidth - margin - 40, y + 4, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  let rightY = y + 10;
  doc.text(`${settings.labelInvoiceNumber || 'Invoice #'} ${invoice.number}`, pageWidth - margin, rightY, { align: 'right' }); rightY += 5;
  doc.text(`${settings.labelDate || 'Date'}: ${invoice.date}`, pageWidth - margin, rightY, { align: 'right' }); rightY += 5;
  doc.text(`${settings.labelDueDate || 'Due'}: ${invoice.dueDate}`, pageWidth - margin, rightY, { align: 'right' });

  y = Math.max(metaY, rightY) + 10;
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderModern(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total) {
  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(0, -3, pageWidth, 13, 3, 3, 'F');
  } else {
    doc.rect(0, 0, pageWidth, 10, 'F');
  }

  let y = 22;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, pageHeight, pageWidth);
}

function renderClean(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 25;
  doc.setFontSize(22);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 8);

  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.ellipse(margin + contentWidth / 2, y + 14, 1.5, 1.5, 'F');

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('INVOICE', pageWidth - margin, y + 8, { align: 'right' });

  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y + 20);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderBold(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 18;
  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(margin, y, contentWidth, 34, 4, 4, 'F');
  } else {
    doc.rect(margin, y, contentWidth, 34, 'F');
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(settings.companyName || 'Your Company', margin + 5, y + 13);

  doc.setFontSize(10);
  doc.text(`#${invoice.number}`, pageWidth - margin - 5, y + 13, { align: 'right' });

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text(`Date: ${invoice.date} | Due: ${invoice.dueDate}`, pageWidth - margin - 5, y + 24, { align: 'right' });

  y += 44;
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderElegant(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 22;
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 60, y);

  doc.setFontSize(20);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 8);

  doc.line(margin + 65, y + 4, margin + contentWidth, y + 4);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice ${invoice.number}`, pageWidth - margin, y + 8, { align: 'right' });

  doc.setFillColor(accent.r, accent.g, accent.b);
  const diamondSize = 2;
  const diamondY = y + 14;
  doc.triangle(margin + 30, diamondY - diamondSize, margin + 30 + diamondSize, diamondY, margin + 30, diamondY + diamondSize, 'F');
  doc.triangle(margin + 30, diamondY - diamondSize, margin + 30 - diamondSize, diamondY, margin + 30, diamondY + diamondSize, 'F');

  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y + 22);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderCompact(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 15;
  doc.setFontSize(14);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(`${settings.companyName || 'Your Company'}`, margin, y + 6);

  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(pageWidth - margin - 28, y, 28, 8, 2, 2, 'F');
  } else {
    doc.rect(pageWidth - margin - 28, y, 28, 8, 'F');
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text('INVOICE', pageWidth - margin - 14, y + 5.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`#${invoice.number} | ${invoice.date} | Due: ${invoice.dueDate} | ${invoice.clientName}`, margin, y + 14);

  y += 22;
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderSidebar(doc, invoice, settings, accent, margin, contentWidth, pageWidth, pageHeight, subtotal, tps, tvq, total) {
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(0, 0, 45, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  const compName = settings.companyName || 'Your Company';
  doc.text(compName, 22, 30, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  let sidebarY = 42;
  if (settings.companyAddress) { doc.text(settings.companyAddress, 22, sidebarY, { align: 'center' }); sidebarY += 5; }
  if (settings.companyEmail) { doc.text(settings.companyEmail, 22, sidebarY, { align: 'center' }); sidebarY += 5; }
  if (settings.companyPhone) { doc.text(settings.companyPhone, 22, sidebarY, { align: 'center' }); sidebarY += 5; }
  if (settings.companyWebsite) { doc.text(settings.companyWebsite, 22, sidebarY, { align: 'center' }); sidebarY += 5; }

  const sideMargin = 55;
  const sideWidth = pageWidth - sideMargin - margin;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text('INVOICE', sideMargin, 25);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`#${invoice.number}`, sideMargin, 33);
  doc.text(`Date: ${invoice.date}`, sideMargin, 39);
  doc.text(`Due: ${invoice.dueDate}`, sideMargin, 45);

  let y = 55;
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
    doc.roundedRect(margin - 3, 12, contentWidth + 6, pageH - 24, 3, 3, 'S');
  } else {
    doc.rect(margin - 3, 12, contentWidth + 6, pageH - 24, 'S');
  }

  doc.setFillColor(accent.r, accent.g, accent.b);
  const dotR = 2;
  doc.ellipse(margin, 12, dotR, dotR, 'F');
  doc.ellipse(margin + contentWidth, 12, dotR, dotR, 'F');
  doc.ellipse(margin, pageH - 12, dotR, dotR, 'F');
  doc.ellipse(margin + contentWidth, pageH - 12, dotR, dotR, 'F');

  let y = 25;
  y = renderHeader(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y);
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, pageH, pageWidth);
}

function renderSubtle(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 25;
  doc.setFontSize(18);
  doc.setTextColor(50, 50, 50);
  doc.text(settings.companyName || 'Your Company', margin, y + 6);

  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 10, margin + 40, y + 10);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 12, margin + 60, y + 12);

  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Invoice #${invoice.number}`, pageWidth - margin, y + 6, { align: 'right' });

  y += 25;
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderStripe(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 18;
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(0, y, pageWidth, 4, 'F');
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(0, y + 6, pageWidth, 1, 'F');
  y += 14;

  doc.setFontSize(16);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Invoice #${invoice.number}`, pageWidth - margin, y + 6, { align: 'right' });

  y += 20;
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderGrid(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  let y = 25;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  doc.setFillColor(accent.r, accent.g, accent.b);
  if (doc.roundedRect) {
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
  } else {
    doc.rect(margin, y, contentWidth, 16, 'F');
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(settings.companyName || 'Your Company', margin + 5, y + 11);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`#${invoice.number}`, pageWidth - margin - 5, y + 11, { align: 'right' });

  y += 22;
  y = renderClientSection(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderLineItems(doc, invoice, settings, accent, margin, contentWidth, y);
  y = renderTotals(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total);
  renderFooter(doc, settings, accent, margin, contentWidth, y, doc.internal.pageSize.getHeight(), pageWidth);
}

function renderCorner(doc, invoice, settings, accent, margin, contentWidth, pageWidth, subtotal, tps, tvq, total) {
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.triangle(pageWidth - 55, 0, pageWidth, 0, pageWidth, 55, 'F');

  doc.setFillColor(Math.min(255, accent.r + 60), Math.min(255, accent.g + 60), Math.min(255, accent.b + 60));
  doc.triangle(pageWidth - 35, 0, pageWidth, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`#${invoice.number}`, pageWidth - 12, 16, { angle: 45 });

  let y = 25;
  doc.setFontSize(18);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(settings.companyName || 'Your Company', margin, y + 6);

  y += 20;
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
