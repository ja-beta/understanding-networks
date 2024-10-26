import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-analytics.js";
import { getDatabase, ref, set, get, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

let db;
let app;
let appName = "collaborative-grid-01";

fetch('/config')
  .then(response => response.json())
  .then(config => {
    // console.log("Config fetched from server:", config);
    init(config.firebaseConfig);
  })
  .catch(error => {
    console.error("Error fetching config:", error);
  });

function init(firebaseConfig) {
    // console.log("Initializing Firebase with config:", firebaseConfig);
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    const analytics = getAnalytics(app);
    // console.log("Firebase initialized:", app);
    subscribeToUsers();
    setupGrid();
}

function subscribeToUsers() {
    const usersRef = ref(db, appName + '/users/');
    onChildAdded(usersRef, (data) => {
        console.log("User added:", data.key, data.val());
    });
    onChildChanged(usersRef, (data) => {
        console.log("User changed:", data.key, data.val());
        let container = document.getElementById(data.key);
        if (!container) {
            container = addDiv(data.key, data);
        }
    });
    onChildRemoved(usersRef, (data) => {
        console.log("User removed:", data.key, data.val());
    });
}

function setupGrid() {
    const gridContainer = document.getElementById("grid-container");
    const blurSlider = document.getElementById("blur-slider");
    const scaleSlider = document.getElementById("scale-slider");

    // console.log("Setting up grid...");

    createGrid(7, 7);
    let cells = Array.from(document.getElementsByClassName("cell"));

    cells.forEach(cell => {
        cell.addEventListener("click", () => {
            console.log("Cell clicked:", cell.id);
            const cellRef = ref(db, `${appName}/cells/${cell.id}`);
            get(cellRef).then((snapshot) => {
                if (snapshot.exists()) {
                    let cellData = snapshot.val();
                    console.log("Cell data fetched:", cellData);
                    if (cellData.currentColor === "white") {
                        cell.style.backgroundColor = "rgb(0, 0, 0)";
                        cellData.currentColor = "black";
                        cellData.whiteCount -= 1;
                        cellData.blackCount += 1;
                    } else {
                        cell.style.backgroundColor = "rgb(255, 255, 255)";
                        cellData.currentColor = "white";
                        cellData.blackCount -= 1;
                        cellData.whiteCount += 1;
                    }
                    set(cellRef, cellData);
                } else {
                    console.log("No data found for cell:", cell.id);
                }
            }).catch(error => {
                console.error("Error fetching cell data:", error);
            });
        });
    });

    blurSlider.value = blurSlider.defaultValue;
    gridContainer.style.filter = `blur(${blurSlider.value}px)`;

    blurSlider.addEventListener("input", (event) => {
        const blurValue = event.target.value;
        gridContainer.style.filter = `blur(${blurValue}px)`;
    });

    scaleSlider.addEventListener("input", (event) => {
        const scaleValue = event.target.value;
        gridContainer.style.transform = `scale(${scaleValue})`;
    });
}

function createGrid(x, y) {
    const gridContainer = document.getElementById("grid-container");
    gridContainer.style.gridTemplateColumns = `repeat(${x}, 48px)`;
    gridContainer.style.gridTemplateRows = `repeat(${y}, 48px)`;

    for (let i = 0; i < y; i++) {  
        for (let j = 0; j < x; j++) {  
            const div = document.createElement("div");
            div.classList.add("cell");
            div.id = i + "-" + j;
            gridContainer.appendChild(div);

            // console.log(`Creating cell ${div.id}`);

            const cellRef = ref(db, `${appName}/cells/${div.id}`);
            get(cellRef).then((snapshot) => {
                if (snapshot.exists()) {
                    let cellData = snapshot.val();
                    // console.log(`Cell ${div.id} data:`, cellData);

                    if (cellData.currentColor === "black") {
                        cellData.blackCount += 1;
                    } else {
                        cellData.whiteCount += 1;
                    }

                    if (cellData.blackCount > cellData.whiteCount) {
                        div.style.backgroundColor = "rgb(0, 0, 0)";
                        cellData.currentColor = "black";
                    } else {
                        div.style.backgroundColor = "rgb(255, 255, 255)";
                        cellData.currentColor = "white";
                    }

                    set(cellRef, cellData);
                } else {
                    const randomColor = Math.random() < 0.5 ? "black" : "white";
                    div.style.backgroundColor = randomColor === "black" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";
                    const newCellData = {
                        blackCount: randomColor === "black" ? 1 : 0,
                        whiteCount: randomColor === "white" ? 1 : 0,
                        currentColor: randomColor
                    };
                    console.log(`New cell ${div.id} data:`, newCellData);
                    set(cellRef, newCellData);
                }
            }).catch((error) => {
                console.error(`Error fetching data for cell ${div.id}:`, error);
            });
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", setupGrid);
} 