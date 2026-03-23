#!/bin/bash
# Download public domain Bible JSON files
set -e

DATA_DIR="$(cd "$(dirname "$0")/.." && pwd)/data"
mkdir -p "$DATA_DIR"

echo "Downloading KJV from thiagobodruk/bible..."
curl -L "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json" \
  -o "$DATA_DIR/kjv_raw.json"

echo "Transforming to Pastor format..."
node -e "
const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('$DATA_DIR/kjv_raw.json', 'utf8').replace(/^\uFEFF/, ''));

// Book name map (66 books in canonical order)
const BOOKS = [
  'Genesis','Exodus','Leviticus','Numbers','Deuteronomy',
  'Joshua','Judges','Ruth','1 Samuel','2 Samuel',
  '1 Kings','2 Kings','1 Chronicles','2 Chronicles',
  'Ezra','Nehemiah','Esther','Job','Psalms','Proverbs',
  'Ecclesiastes','Song of Solomon','Isaiah','Jeremiah',
  'Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos',
  'Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah',
  'Haggai','Zechariah','Malachi',
  'Matthew','Mark','Luke','John','Acts',
  'Romans','1 Corinthians','2 Corinthians','Galatians',
  'Ephesians','Philippians','Colossians',
  '1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy',
  'Titus','Philemon','Hebrews','James',
  '1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
];

const out = [];
raw.forEach((bookData, bookIdx) => {
  const book = BOOKS[bookIdx];
  if (!book) return;
  bookData.chapters.forEach((chapter, chIdx) => {
    chapter.forEach((text, vIdx) => {
      out.push({ book, chapter: chIdx + 1, verse: vIdx + 1, text: text.trim() });
    });
  });
});

fs.writeFileSync('$DATA_DIR/kjv.json', JSON.stringify(out));
console.log('KJV: ' + out.length + ' verses written to data/kjv.json');
console.log('Run: npm run import-kjv');
"
