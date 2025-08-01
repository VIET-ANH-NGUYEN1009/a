// document.addEventListener("DOMContentLoaded", () => {
//   const btnReceive = document.querySelector(".btn_code");
//   const inputCode = document.querySelector(".code input");
//   const inputCodeSolenoid = document.querySelector(".code_solenoid input");

//   btnReceive.addEventListener("click", async (event) => {
//     event.preventDefault();

//     const code = inputCode.value;

//     try {
//       const response = await fetch(
//         `http://localhost:4000/api.masterkey/get_code`
//       );
//       const data = await response.json();
//       console.log("Receive Response:", data);

//       if (response.ok && data.result === "OK") {
//         inputCodeSolenoid.value = data.code_solenoid;
//         alert("Received cod solenoid " + data.code_solenoid);
//       } else {
//         alert(data.message || "Don't find code solenoid");
//       }
//     } catch (error) {
//       console.error("Receive error:", error);
//       alert("Don't Connect.");
//     }
//   });
// });

// document.addEventListener("DOMContentLoaded", () => {
//   const btnUpdate = document.querySelector(".btn_update");
//   const inputCodeSolenoid = document.querySelector(".code_solenoid input");
//   const inputCode = document.querySelector(".code input");

//   btnUpdate.addEventListener("click", async (event) => {
//     event.preventDefault();

//     const codeSolenoid = inputCodeSolenoid.value.trim();
//     const code = inputCode.value.trim();

//     if (!codeSolenoid || !code) {
//       alert("Please fill Code và Code_Solenoid");
//       return;
//     }

//     try {
//       const response = await fetch(
//         `http://localhost:4000/api.masterkey/update_code/${code}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ code_solenoid: codeSolenoid }),
//         }
//       );

//       const data = await response.json();
//       console.log("Update Response:", data);

//       if (response.ok && data.result === "OK") {
//         alert("Update success!");
//       } else {
//         alert(data.message || "Update fail");
//       }
//     } catch (error) {
//       console.error("Update error:", error);
//       alert("Don't connect server.");
//     }
//   });
// });

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.querySelector("#solenoidTable tbody");
  const infoList = document.querySelector("#info_list");
  const inputCode = document.querySelector(".code input");
  const API_URL = "http://localhost:4000/api.masterkey/get_code";

  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (response.ok && data.result === "OK") {
      tableBody.innerHTML = "";

      data.code_solenoids.forEach((item, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td >${index + 1}</td>
          <td id ="txtSolenoid_${index + 1}">${item.Code_solenoid}</td>
          <td>${item.Code}</td>
          <td>${item.DATETIME}</td>
          <td>
            <button 
              onclick="updateData(${index + 1},${
          item.Code_solenoid
        } ,${infoList})"
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

document.addEventListener("DOMContentLoaded", () => {
  const btnReceive = document.querySelector(".btn_code");
  const inputCode = document.querySelector(".code input");
  const infoList = document.querySelector("#info_list");

  btnReceive.addEventListener("click", async (event) => {
    event.preventDefault();

    const code = inputCode.value.trim();
    if (!code) {
      alert("Vui lòng nhập code.");
      return;
    }
    callGetData(code, infoList);
    // try {
    //   const response = await fetch(
    //     `http://localhost:4000/api.masterkey/get_name?code=${code}`
    //   );
    //   const data = await response.json();

    //   infoList.innerHTML = "";

    //   if (response.ok && data.result === "OK") {
    //     const info = data.info;

    //     for (const [key, value] of Object.entries(info)) {
    //       const li = document.createElement("li");
    //       li.id = `${key}`;
    //       li.textContent = `${key}: ${value}`;
    //       infoList.appendChild(li);
    //     }
    //   } else {
    //     const li = document.createElement("li");
    //     li.textContent = data.message || "Không tìm thấy thông tin.";
    //     infoList.appendChild(li);
    //   }
    // } catch (error) {
    //   console.error("Lỗi khi gọi get_name:", error);
    //   infoList.innerHTML = "<li>Lỗi kết nối đến server.</li>";
    // }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const btnReceive = document.querySelector(".btn_code");
  const inputCode = document.querySelector(".code input");
  const infoList = document.querySelector("#info_list");

  btnReceive.addEventListener("click", async (event) => {
    event.preventDefault();

    const code = inputCode.value.trim();
    if (!code) {
      alert("Vui lòng nhập code.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:4000/api.masterkey/get_name?code=${code}`
      );
      const data = await response.json();

      infoList.innerHTML = "";

      if (response.ok && data.result === "OK") {
        const info = data.info;

        for (const [key, value] of Object.entries(info)) {
          const li = document.createElement("li");
          li.textContent = `${key}: ${value}`;
          infoList.appendChild(li);
        }
      } else {
        const li = document.createElement("li");
        li.textContent = data.message || "Không tìm thấy thông tin.";
        infoList.appendChild(li);
      }
    } catch (error) {
      console.error("Lỗi khi gọi get_name:", error);
      infoList.innerHTML = "<li>Lỗi kết nối đến server.</li>";
    }
  });
});

const callGetData = async (code, infoList) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api.masterkey/get_name?code=${code}`
    );
    const data = await response.json();

    infoList.innerHTML = "";

    if (response.ok && data.result === "OK") {
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
    console.error("Lỗi khi gọi get_name:", error);
    infoList.innerHTML = "<li>Lỗi kết nối đến server.</li>";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#solenoidTable tbody");

  tableBody.addEventListener("click", async (event) => {
    if (event.target.classList.contains("btn_update_row")) {
      const button = event.target;
      //const code = button.dataset.code;
      const codeSolenoid = button.dataset.codeSolenoid;
      const codeID = document.querySelector(".code input");
      code = codeID.value.trim();
      const row = button.closest("tr");
      const index = row.rowIndex;

      await updateData(index, code, codeSolenoid, button);
    }
  });
});

const updateData = async (index, code, codeSolenoid, buttonElement) => {
  buttonElement.textContent = "⏳ Đang cập nhật...";
  console.log(code);

  console.log(codeSolenoid);
  try {
    const response = await fetch(
      `http://localhost:4000/api.masterkey/update_code/${codeSolenoid}&${code}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ codeSolenoid, code }),
      }
    );

    const data = await response.json();

    if (response.ok && data.result === "OK") {
      alert(
        `✅ Cập nhật dòng ${index}\nCode: ${code}\nCode_solenoid: ${codeSolenoid}`
      );
    } else {
      alert(`❌ Lỗi: ${data.message || "Cập nhật thất bại"}`);
    }
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
    alert("⚠️ Không thể kết nối máy chủ.");
  } finally {
    buttonElement.disabled = false;
    buttonElement.textContent = "Update";
  }
};
