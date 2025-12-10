let questions = [];
let showAnswers = false;
let currentIndex = 0;
let score = 0;
let selectedQuestions = [];

async function loadQuestions() {
  const res = await fetch("questions.json");
  questions = await res.json();
}

function startQuiz() {
  const num = parseInt(document.getElementById("numQuestions").value);
  showAnswers = document.getElementById("showAnswers").checked;

  const shuffled = questions.sort(() => 0.5 - Math.random());
  selectedQuestions = shuffled.slice(0, num);

  currentIndex = 0;
  score = 0;

  document.getElementById("setup").classList.add("hidden");
  document.getElementById("quiz").classList.remove("hidden");

  renderQuestion();
}

function renderQuestion() {
  const quizDiv = document.getElementById("quiz");
  quizDiv.innerHTML = "";

  if (currentIndex >= selectedQuestions.length) {
    quizDiv.innerHTML = `
      <div class="result-box">
        <h2>จบการสอบ</h2>
        <p>คุณตอบถูก ${score}/${selectedQuestions.length} ข้อ</p>
        <button id="backBtn">กลับไปหน้าแรก</button>
      </div>
    `;
    document.getElementById("backBtn").onclick = () => {
      document.getElementById("quiz").classList.add("hidden");
      document.getElementById("setup").classList.remove("hidden");
    };
    return;
  }

  const q = selectedQuestions[currentIndex];
  const qDiv = document.createElement("div");
  qDiv.className = "question";
  qDiv.innerHTML = `<h3>${currentIndex + 1}. ${q.question}</h3>`;

  // ✅ ถ้าโจทย์มีรูปภาพ → แสดงรูปประกอบ
  if (q.question_image && q.question_image.trim() !== "") {
    const img = document.createElement("img");
    img.src = q.question_image;
    img.alt = "Question image";
    img.style.maxWidth = "400px";
    img.style.display = "block";
    img.style.margin = "10px 0";
    qDiv.appendChild(img);
  }

  // ✅ ตรวจสอบว่าเป็นโจทย์แบบ Choose two/three หรือไม่
  const isChooseTwo = q.question.includes("(Choose two.)");
  const isChooseThree = q.question.includes("(Choose three.)");

  if (isChooseTwo || isChooseThree) {
    // ใช้ checkbox โดยให้ label ครอบ input → ช่องอยู่หน้าข้อความ
    for (const [key, value] of Object.entries(q.options)) {
      const wrapper = document.createElement("div");
      wrapper.className = "checkbox-group";

      const label = document.createElement("label");
      label.style.display = "flex";
      label.style.alignItems = "center";
      label.style.gap = "8px";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = key;
      input.className = "option";

      const textNode = document.createTextNode(`${key}: ${value}`);

      label.appendChild(input);
      label.appendChild(textNode);

      wrapper.appendChild(label);
      qDiv.appendChild(wrapper);
    }

    // ปุ่มยืนยันคำตอบ
    const submitBtn = document.createElement("button");
    submitBtn.textContent = "ยืนยันคำตอบ";
    submitBtn.className = "next-btn";
    submitBtn.onclick = () => {
      const selected = [...qDiv.querySelectorAll(".option:checked")].map(opt => opt.value);
      checkAnswer(selected, q.answers, q, qDiv, isChooseTwo, isChooseThree);
    };
    qDiv.appendChild(submitBtn);

  } else {
    // แบบเลือกคำตอบเดียว
    for (const [key, value] of Object.entries(q.options)) {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = `${key}: ${value}`;
      btn.onclick = () => checkAnswer([key], q.answers, q, qDiv, false, false);
      qDiv.appendChild(btn);
    }
  }

  quizDiv.appendChild(qDiv);
}

function checkAnswer(selectedChoices, answers, q, qDiv, isChooseTwo, isChooseThree) {
  // ปิดการเลือกเพิ่ม
  const allOptions = qDiv.querySelectorAll(".option");
  allOptions.forEach(opt => (opt.disabled = true));

  let feedback = "";

  // ✅ ตรวจว่าต้องเลือกครบตามจำนวน
  let requiredCount = 1;
  if (isChooseTwo) requiredCount = 2;
  if (isChooseThree) requiredCount = 3;

  const isCorrect =
    selectedChoices.length === requiredCount &&
    selectedChoices.every(choice => answers.includes(choice));

  if (showAnswers) {
    if (isCorrect) {
      feedback += "<p class='correct'>ถูกต้อง ✅</p>";
      score++;
    } else {
      // ✅ เพิ่มบอกคำตอบที่ถูกต้องแบบเต็มข้อความ
      feedback += "<p class='wrong'>ผิด ❌</p>";
      const correctAnswers = answers.map(ans => `${ans}: ${q.options[ans]}`).join(", ");
      feedback += `<p>ข้อที่ถูกต้องคือ: ${correctAnswers}</p>`;
    }

    if (q.explanation && q.explanation.trim() !== "") {
      feedback += `<p><strong>Explanation:</strong> ${q.explanation}</p>`;
    }
    if (q.reference && q.reference.trim() !== "") {
      feedback += `<p><strong>Reference:</strong> ${q.reference}</p>`;
    }
  } else {
    if (isCorrect) score++;
  }

  const feedbackDiv = document.createElement("div");
  feedbackDiv.className = "feedback";
  feedbackDiv.innerHTML = feedback;

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "ข้อถัดไป";
  nextBtn.className = "next-btn";
  nextBtn.onclick = () => {
    currentIndex++;
    renderQuestion();
  };

  feedbackDiv.appendChild(nextBtn);
  qDiv.appendChild(feedbackDiv);
}

loadQuestions();
