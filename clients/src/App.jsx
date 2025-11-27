import React, { useState } from "react";
import "./App.css";
function App() {
  const [mode, setMode] = useState("text"); 
  const [textMateri, setTextMateri] = useState("");
  const [fileMateri, setFileMateri] = useState(null);
  const [soalList, setSoalList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleBuatSoal = async () => {
    if (mode === "text" && !textMateri) return alert("Isi teks materi dulu!");
    if (mode === "file" && !fileMateri) return alert("Pilih file dulu!");

    setLoading(true);
    setSoalList([]); // Kosongkan dulu biar animasi ulang jalan

    const formData = new FormData();
    if (mode === "text") {
      formData.append("text_materi", textMateri);
    } else {
      formData.append("file_materi", fileMateri);
    }

    try {
      const response = await fetch("http://localhost:5000/api/buat-kuis", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSoalList(result.data);
      } else {
        alert("Gagal: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* --- FORM INPUT --- */}
      <div className="input-section">
        <h1>AI Quiz Generator</h1>
        
        <div className="mode-buttons">
          <button
            onClick={() => setMode("text")}
            className={mode === "text" ? "active" : ""}
          >
            📝 Teks Materi
          </button>
          <button
            onClick={() => setMode("file")}
            className={mode === "file" ? "active" : ""}
          >
            📂 Upload File
          </button>
        </div>

        {mode === "text" ? (
          <textarea
            rows="6"
            placeholder="Paste materi pelajaran di sini..."
            value={textMateri}
            onChange={(e) => setTextMateri(e.target.value)}
          />
       ) : (
  <div className="file-upload-wrapper">
      <p className="support-text">Support PDF, JPG, PNG</p>
      
      {/* 1. Input Asli disembunyikan */}
      <input
        type="file"
        id="file-upload" // ID ini penting untuk trigger
        accept=".pdf, image/*"
        onChange={(e) => setFileMateri(e.target.files[0])}
        style={{ display: "none" }} 
      />

      {/* 2. Label yang bertindak sebagai Tombol Keren */}
      <label htmlFor="file-upload" className="custom-file-upload">
        📁 Pilih File Materi
      </label>

      {/* 3. Menampilkan Nama File yang dipilih agar terbaca jelas */}
      <div className="file-name-display">
        {fileMateri ? (
          <span className="file-selected">✅ {fileMateri.name}</span>
        ) : (
          <span className="file-placeholder">Belum ada file dipilih</span>
        )}
      </div>
  </div>
)}

        <button 
          className="generate-btn" 
          onClick={handleBuatSoal} 
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="loader"></div> Sedang Berpikir...
            </>
          ) : (
            "Buat Soal Sekarang"
          )}
        </button>
      </div>

      {/* --- HASIL KUIS --- */}
      <div className="quiz-section">
        {soalList.map((item, index) => (
          <div 
            key={index} 
            className="quiz-item"
            style={{ animationDelay: `${index * 0.2}s` }} 
          >
            <h3>{index + 1}. {item.soal}</h3>
            
            <div className="options-list">
              {item.pilihan.map((pilihan, idx) => (
                <button
                  key={idx}
                  className="option-btn"
                  onClick={(e) => {
                    const hurufPilihan = pilihan.charAt(0);
                    const hurufJawaban = item.jawaban_benar.charAt(0);
                    
                    // Reset style dulu agar bersih
                    e.target.style.transition = "all 0.3s";

                    if (hurufPilihan === hurufJawaban) {
                      e.target.style.background = "#d1e7dd"; 
                      e.target.style.borderColor = "#badbcc";
                      e.target.style.color = "#0f5132";
                      e.target.style.fontWeight = "bold";
                      e.target.innerText = "✅ " + pilihan;
                    } else {
                      e.target.style.background = "#f8d7da";
                      e.target.style.borderColor = "#f5c6cb";
                      e.target.style.color = "#842029";
                      e.target.innerText = "❌ " + pilihan;
                    }
                  }}
                >
                  {pilihan}
                </button>
              ))}
            </div>

            <details>
              <summary>Lihat Kunci Jawaban</summary>
              <p>Jawaban Benar: <strong>{item.jawaban_benar}</strong></p>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;