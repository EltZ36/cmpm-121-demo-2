import "./style.css";

const APP_NAME = "Hello My name is Jeff";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;
