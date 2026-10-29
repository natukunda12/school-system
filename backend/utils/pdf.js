function drawSchoolMark(doc, x, y) {
  doc.save();
  doc.circle(x + 18, y + 18, 17).lineWidth(1.2).stroke('#2F6B3A');
  doc.circle(x + 18, y + 18, 14).lineWidth(0.5).stroke('#7A5230');
  doc.fillColor('#2F6B3A').font('Helvetica-Bold').fontSize(9)
    .text('CMS', x + 3, y + 13, { width: 30, align: 'center', lineBreak: false });
  doc.restore();
}

function drawCardHeader(doc, schoolName, title, logos) {
  if (logos) {
    doc.image(logos.left, 33, 25, { fit: [36, 36] });
    doc.image(logos.right, doc.page.width - 69, 25, { fit: [36, 36] });
  } else {
    drawSchoolMark(doc, 33, 25);
    drawSchoolMark(doc, doc.page.width - 69, 25);
  }
  doc.fillColor('#2F6B3A').font('Helvetica-Bold').fontSize(16)
    .text(schoolName, 70, 29, { width: doc.page.width - 140, align: 'center', lineBreak: false });
  doc.fillColor('#7A5230').font('Helvetica').fontSize(10)
    .text(title, 36, 54, { width: doc.page.width - 72, align: 'center' });
  doc.y = 76;
}

module.exports = { drawCardHeader };
