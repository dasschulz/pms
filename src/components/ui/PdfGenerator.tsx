import React, { useState } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';

const PdfGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const handleGeneratePdf = async () => {
    setLoading(true);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();
    const fontSize = 30;
    page.drawText('Hello, this is your PDF!', {
      x: 50,
      y: height - 4 * fontSize,
      size: fontSize,
      color: rgb(0, 0.53, 0.71),
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleGeneratePdf} disabled={loading}>
        {loading ? 'Generating...' : 'Generate PDF'}
      </button>
      {loading && <div>Loading...</div>}
      {pdfUrl && <a href={pdfUrl} download="generated.pdf">Download PDF</a>}
    </div>
  );
};

export default PdfGenerator; 