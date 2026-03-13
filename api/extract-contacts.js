import formidable from 'formidable';
import fs from 'fs';
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';

export const config = {
  api: { bodyParser: false }, // फाइल अपलोड के लिए बॉडीपार्सर बंद करना पड़ता है
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm();
  
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload failed" });

    const file = files.file;
    const filePath = file.filepath;
    let extractedText = "";

    try {
      if (file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        extractedText = data.text;
      } 
      else if (file.mimetype.includes('sheet') || file.mimetype.includes('excel') || file.mimetype.includes('csv')) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        extractedText = XLSX.utils.sheet_to_txt(sheet);
      } else {
        extractedText = fs.readFileSync(filePath, 'utf8');
      }

      // --- असली जादू: RegEx (नंबर ढूँढने का फार्मूला) ---
      // यह 10 से 12 डिजिट के नंबर्स को ढूँढेगा
      const phoneRegex = /(?:\+?\d{1,3}[- ]?)?\d{10}\b/g;
      const foundNumbers = extractedText.match(phoneRegex) || [];
      
      // डुप्लीकेट नंबर्स हटाना और फॉर्मेट साफ़ करना
      const cleanNumbers = [...new Set(foundNumbers.map(n => n.replace(/\D/g, '')))];

      return res.status(200).json({ numbers: cleanNumbers });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
}
