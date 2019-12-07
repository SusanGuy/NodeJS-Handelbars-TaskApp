let text;
const profilePictureSource = document
    .querySelector("#profile-pic")
    .getAttribute("src");

const fileInput = document.createElement("input");
fileInput.setAttribute("id", "file");
fileInput.setAttribute("type", "file");
fileInput.setAttribute("name", "file");

if (
    profilePictureSource ===
    "http://icons.iconarchive.com/icons/jonathan-rey/simpsons/256/Bart-Simpson-01-icon.png"
) {
    text = document.createTextNode("Upload Photo");
    document.querySelector("#upload-status").appendChild(text);
} else {
    text = document.createTextNode("Change Photo");
    document.querySelector("#upload-status").appendChild(text);
}
document.querySelector("#upload-status").appendChild(fileInput);

if (
    document.querySelector("#upload-status").textContent.trim() === "Upload Photo"
) {
    document.querySelector("#delete-button").style.display = "none";
}

document.querySelector("#file").onchange = () => {
    document.querySelector("#submit-form").submit();
};