const tableBody = document.querySelector("#solenoidTable tbody");
const infoList = document.querySelector("#info_list");
const inputCode = document.querySelector(".code input");
const btnReceive = document.querySelector(".btn_code");

document.addEventListener("DOMContentLoaded", async () => {
  
  const API_URL = "http://localhost:4000/api.masterkey/get_code";

  try {
    const response = await axios.get(API_URL);
    const data = response.data;

    if (data.result === "OK") {
      tableBody.innerHTML = "";

      data.code_solenoids.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${index + 1}</td>
          <td id="txtSolenoid_${index + 1}">${item.Code_solenoid}</td>
          <td>${item.Code}</td>
          <td>${item.DATETIME}</td>
          <td>
            <button 
              onclick="updateData(${index + 1}, '${item.Code_solenoid}', ${infoList})"
              class="btn_update_row" 
              data-code="${item.Code}" 
              data-code-solenoid="${item.Code_solenoid}"
            >
              Update
            </button>
          </td>
        `;

        tableBody.appendChild(row);
      });
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">Không có dữ liệu</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error("Error loading data:", error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="5">Lỗi kết nối server</td>
      </tr>
    `;
  }
});


const callGetData = async (code, infoList) => {
  try {
    const response = await axios.get(`http://localhost:4000/api.masterkey/get_name?code=${code}`);
    const data = response.data;

    infoList.innerHTML = "";

    if (data.result === "OK") {
      const info = data.info;

      for (const [key, value] of Object.entries(info)) {
        const li = document.createElement("li");
        li.id = `${key}`;
        li.textContent = `${key}: ${value}`;
        infoList.appendChild(li);
      }
    } else {
      const li = document.createElement("li");
      li.textContent = data.message || "Không tìm thấy thông tin.";
      infoList.appendChild(li);
    }
  } catch (error) {
    console.error( error);
    infoList.innerHTML = "<li>Dont't connect server.</li>";
  }
};


document.addEventListener("DOMContentLoaded", () => {

  btnReceive.addEventListener("click", async (event) => {
    event.preventDefault();

    const code = inputCode.value.trim();
    if (!code) {
      alert("Please fill code.");
      return;
    }

    btnReceive.disabled = true;
    infoList.innerHTML = "<li>Loading...</li>";

    try {
      await callGetData(code, infoList);
    } finally {
      btnReceive.disabled = false;
    }
  });
});

const updateData = async (index, code, codeSolenoid, buttonElement) => {
  buttonElement.textContent = "⏳";
  buttonElement.disabled = true;

  try {
    const response = await axios.get(
      `http://localhost:4000/api.masterkey/update_code?codeSolenoid=${encodeURIComponent(codeSolenoid)}&code=${encodeURIComponent(code)}`
    );

    const data = response.data;

    if (response.status === 200 && data.result === "OK") {
      alert(`Update ${index}\nCode: ${code}\nCode_solenoid: ${codeSolenoid}`);
    } else {
      alert(`Error: ${data.message || "fail"}`);
    }
  } catch (error) {
    console.error( error);
    alert("Don't Connect.");
  } finally {
    buttonElement.textContent = "Update";
    buttonElement.disabled = false;
  }
};


