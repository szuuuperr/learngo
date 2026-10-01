// Kuis fundamental IT — 10 soal pilihan ganda.
//
// Di-hardcode sesuai brief Tahap 6. Tidak diambil dari Langflow atau database:
// kuis ini harus bisa dijawab offline dan hasilnya deterministik, jadi
// menambah model tidak boleh mengubah kunci jawaban.
//
// `answer` adalah index O(0-based) ke `options`, bukan teksnya. Mengubah
// urutan opsi jadi mengubah jawaban, tapi mengganti seluruh isi pertanyaan
// tidak. Warna merah/ijau di UI juga membandingkan index, bukan string.

export const QUIZ_QUESTIONS = [
  {
    question: 'Apa kepanjangan O dalam notasi Big-O?',
    options: [
      'Operational',
      'Order of growth',
      'Open',
      'Optimal',
    ],
    answer: 1,
    explanation:
      'Big-O menggambarkan order of growth: bagaimana running time atau memori berubah ketika ukuran input bertambah.',
  },
  {
    question: 'Struktur data yang bekerja dengan prinsip FIFO (First In First Out) adalah…',
    options: ['Stack', 'Queue', 'Linked List', 'Hash Table'],
    answer: 1,
    explanation:
      'Queue masuk di depan dan keluar di belakang. Stack justru LIFO - yang terakhir masuk, yang pertama keluar.',
  },
  {
    question: 'Kompleksitas waktu searching biner pada array terurut adalah…',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
    answer: 2,
    explanation:
      'Setiap langkah membuang separuh sisa array, jadi ruang pencarian berkurang dua kali lipat tiap iterasi.',
  },
  {
    question: 'Di mana data disimpan pada struktur data linked list?',
    options: [
      'Dalam array berindeks',
      'Dalam node yang saling menunjuk lewat pointer',
      'Dalam tabel hash',
      'Dalam stack pada memori',
    ],
    answer: 1,
    explanation:
      'Setiap node menyimpan data dan pointer ke node berikutnya. Tidak perlu area memori yang bersebelahan seperti array.',
  },
  {
    question: 'Apa yang dilakukan fungsi hash?',
    options: [
      'Mengurutkan data dari besar ke kecil',
      'Mengubah kunci menjadi indeks pada tabel',
      'Menghapus duplikat dengan selalu menyimpan nilai pertama',
      'Menghitung jumlah karakter pada sebuah string',
    ],
    answer: 1,
    explanation:
      'Hash function memetakan kunci ke indeks. Konsekuensinya, searching jadi O(1) rata-rata - bukan karena hashing lambat, tapi karena tabel yang lapang membuat tabrakan jarang terjadi.',
  },
  {
    question: 'Manakah yang merupakan contoh struktur data Linear?',
    options: ['Binary Tree', 'Hash Table', 'Array', 'Graph'],
    answer: 2,
    explanation:
      'Array bersifat linear: setiap elemen punya tepat satu pendahulu dan satu penerus. Binary tree dan graph tidak linear.',
  },
  {
    question: 'Apa output yang akan dihasilkan kode berikut?\n\nint total = 0;\nfor (int i = 1; i <= 100; i++) {\n    total += i;\n}',
    options: ['5050', '10000', '4950', '99'],
    answer: 0,
    explanation:
      'Ini penjumlahan 1 sampai 100. Rumus Gauss n(n+1)/2 = 100 × 101 / 2 = 5050.',
  },
  {
    question: 'Apa perbedaan utama antara array dan linked list?',
    options: [
      'Linked list selalu menyimpan data lebih sedikit',
      'Array mendukung duplikasi, linked list tidak',
      'Array menyimpan elemen berurutan dengan indeks, linked list dengan pointer',
      'Linked list tidak bisa menyimpan nilai primitive',
    ],
    answer: 2,
    explanation:
      'Array elemennya bersebelahan di memori dan diakses lewat indeks, yang membuatnya O(1). Linked list tidak bersebelahan, jadi searching-nya O(n).',
  },
  {
    question: 'Manakah yang paling tepat menggambarkan sebuah stack?',
    options: [
      'Elemen yang paling baru dimasukkan adalah yang pertama dikeluarkan',
      'Elemen yang paling awal dimasukkan adalah yang pertama dikeluarkan',
      'Elemen selalu disimpan terurut berdasarkan nilainya',
      'Elemen hanya bisa diakses dari tengah list',
    ],
    answer: 0,
    explanation: 'Stack memakai LIFO: Last In, First Out.',
  },
  {
    question: 'Apa satuan dari kompleksitas waktu O(n)?',
    options: ['detik', 'jumlah operasi', 'persentase memori', 'bita data'],
    answer: 1,
    explanation:
      'Notasi Big-O mengukur jumlah operasi, bukan satuan waktu fisik. Ini yang membuatnya bisa dibandingkan antar bahasa dan mesin.',
  },
]

export const XP_PER_CORRECT = 10
export const CERTIFICATION_XP = 100