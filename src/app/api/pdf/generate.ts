import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { username, date } = req.body;

    const pdfDoc = await PDFDocument.create();

    // Load fonts
    const workSansFontBytes = fs.readFileSync(path.resolve('./public/fonts/WorkSans-Regular.ttf'));
    const interFontBytes = fs.readFileSync(path.resolve('./public/fonts/Inter-Regular.ttf'));

    const workSansFont = await pdfDoc.embedFont(workSansFontBytes);
    const interFont = await pdfDoc.embedFont(interFontBytes);

    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();

    // Header
    const headerText = `Dossier für ${username}, MdB | ${date}`;
    page.drawText(headerText, {
      x: 10,
      y: height - 20,
      size: 10,
      font: interFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pageNumberText = `Seite 1 von 1`;
    page.drawText(pageNumberText, {
      x: width - 100,
      y: height - 20,
      size: 10,
      font: interFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Main Heading
    page.drawText('Main Heading', {
      x: 50,
      y: height - 100,
      size: 24,
      font: workSansFont,
      color: rgb(0, 0, 0),
    });

    // Subheading
    page.drawText('Subheading', {
      x: 50,
      y: height - 130,
      size: 18,
      font: workSansFont,
      color: rgb(0, 0, 0),
    });

    // Body Text
    page.drawText('This is the body text in Inter font.', {
      x: 50,
      y: height - 160,
      size: 12,
      font: interFont,
      color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=dossier.pdf');
    res.send(Buffer.from(pdfBytes));
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 