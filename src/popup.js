const homePanelElement = document.querySelector("#home-panel");

const addMarkSectionElement = document.querySelector("#add-mark-section");
const marksListSectionElement = document.querySelector("#marks-list-section");
const savedMarksListElement = document.querySelector("#saved-marks-select");
const markFormPanelElement = document.querySelector("#mark-form-panel");

const groupsListPanelElement = document.querySelector("#groups-list-panel");
const groupFormPanelElement = document.querySelector("#group-form-panel");

const messageBox = document.querySelector(".message-box");
const messageBoxSubmitBtn = document.querySelector("#message-box-submit");
const messageBoxCancelBtn = document.querySelector("#message-box-cancel");

const savePanelBtn = document.querySelector("#save-panel-btn");
const loadPanelBtn = document.querySelector("#load-panel-btn");

let selectedMarkId;
let savedMarksList = [];

const activityStack = [homePanelElement];

function addToActivityStack(panel) {
  previousActivity = activityStack[activityStack.length - 1];

  if (!previousActivity.classList.contains("hidden"))
    previousActivity.classList.add("hidden");

  activityStack.push(panel);

  panel.classList.remove("hidden");
}

function popFromActivityStack() {
  if (activityStack.length == 1) return;

  const currentActivity = activityStack.pop();

  if (!currentActivity.classList.contains("hidden")) {
    currentActivity.classList.add("hidden");
  }

  activityStack[activityStack.length - 1].classList.remove("hidden");
}

function openPanel(panel) {
  if (panel.classList.contains("hidden")) {
    addToActivityStack(panel);
  }
}

function openSettings() {
  browser.runtime.openOptionsPage();
}

function getCurrentDateAndTime() {
  let currentDate = new Date();

  let year = currentDate.getFullYear();
  let month = currentDate.getMonth() + 1;
  let day = currentDate.getDate();

  let hours = currentDate.getHours();
  let minutes = currentDate.getMinutes();
  let seconds = currentDate.getSeconds();

  const date = `${year}-${month}-${day}`;
  const time = `${hours}:${minutes}:${seconds}`;

  return { date, time };
}

function fillMarkForm({
  url = "",
  icon = "",
  title = "",
  scrollPosition = "",
  selectionRange = "",
  requestType = "add",
  markId = null,
}) {
  document.querySelector("#mark-form-icon").src = icon;
  document.querySelector("#mark-form-url").value = url;
  document.querySelector("#mark-form-title").value = title;
  document.querySelector("#mark-scroll-position").value = scrollPosition;
  document.querySelector("#mark-selection-range").value = selectionRange;
  document.querySelector("#mark-request-type").value = requestType;
  document.querySelector("#mark-id-form").value = markId;
}

function handleMarkCardClick({ currentTarget }) {
  selectedMarkId = currentTarget.getAttribute("id");

  const cardItems = document.querySelectorAll(".mark-card-item");
  if (cardItems && cardItems.length > 0)
    cardItems.forEach((item) => {
      if (item.classList.contains("active")) item.classList.remove("active");
    });

  if (!currentTarget.classList.contains("active"))
    currentTarget.classList.add("active");
}

function renderSavedMarksList() {
  savedMarksListElement.innerHTML = "";
  savedMarksList.forEach(({ markId, icon, url, title, date, time }) => {
    const markCardTemplate = document.querySelector("#mark-card-template");
    const markCard = markCardTemplate.content.cloneNode(true);

    const markCardContainer = markCard.querySelector(".mark-card-item");
    markCardContainer.setAttribute("id", markId);
    if (selectedMarkId == markId) markCardContainer.classList.add("active");

    markCard.querySelector(".mark-card-icon img").src = icon;
    markCard.querySelector(".mark-card-title").innerText = title;
    markCard.querySelector(".mark-card-datetime").innerText = `${date} ${time}`;

    const markCardUrl = markCard.querySelector(".mark-card-url");
    markCardUrl.href = url;
    markCardUrl.innerText = url;

    markCardContainer.addEventListener("click", handleMarkCardClick);

    savedMarksListElement.appendChild(markCard);
  });
}

async function updateMarksList() {
  const response = await browser.runtime.sendMessage({ action: "getMarks" });

  savedMarksList = JSON.parse(response.data);

  selectedMarkId = savedMarksList.length > 0 ? savedMarksList[0].markId : null;

  renderSavedMarksList();
}

function closeMessageBox() {
  if (!messageBox.classList.contains("hidden"))
    messageBox.classList.add("hidden");
}

function showMessageBox({
  message = "",
  onSubmit = function () {},
  onCancel = function () {},
}) {
  messageBox.querySelector(".message-box-card p").innerText = message;

  messageBoxSubmitBtn.addEventListener("click", function handleSubmit() {
    onSubmit();
    messageBoxSubmitBtn.removeEventListener("click", handleSubmit);
    closeMessageBox();
  });

  messageBoxCancelBtn.addEventListener("click", function handleCancel() {
    onCancel();
    messageBoxCancelBtn.removeEventListener("click", handleCancel);
    closeMessageBox();
  });

  if (messageBox.classList.contains("hidden"))
    messageBox.classList.remove("hidden");
}

savePanelBtn.addEventListener("click", function () {
  if (addMarkSectionElement.classList.contains("hidden")) {
    savePanelBtn.classList.add("active");
    addMarkSectionElement.classList.remove("hidden");
  }

  if (!marksListSectionElement.classList.contains("hidden")) {
    loadPanelBtn.classList.remove("active");
    marksListSectionElement.classList.add("hidden");
  }
});

loadPanelBtn.addEventListener("click", async function () {
  await updateMarksList();

  if (!addMarkSectionElement.classList.contains("hidden")) {
    savePanelBtn.classList.remove("active");
    addMarkSectionElement.classList.add("hidden");
  }

  if (marksListSectionElement.classList.contains("hidden")) {
    loadPanelBtn.classList.add("active");
    marksListSectionElement.classList.remove("hidden");
  }
});

document.querySelector("#add-mark-btn").addEventListener("click", function () {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const currentTab = tabs[0];

    browser.tabs
      .sendMessage(currentTab.id, { action: "getPageMarkData" })
      .then(({ scrollPosition, selectionRange }) => {
        const url = currentTab.url;
        const title = currentTab.title;
        const icon = `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`;

        fillMarkForm({
          url,
          icon,
          title,
          scrollPosition,
          selectionRange,
        });

        openPanel(markFormPanelElement);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});

document.querySelector("#settings-btn").addEventListener("click", function () {
  openSettings();
});

document.querySelectorAll(".cancel-btn, .back-btn").forEach(function (element) {
  element.addEventListener("click", function () {
    popFromActivityStack();
  });
});

document
  .querySelector("#submit-mark-form")
  .addEventListener("click", async function () {
    const icon = document.querySelector("#mark-form-icon").src;
    const url = document.querySelector("#mark-form-url").value;
    const title = document.querySelector("#mark-form-title").value;
    const groupId = document.querySelector("#mark-form-group-select").value;
    const scrollPosition = document.querySelector(
      "#mark-scroll-position",
    ).value;
    const selectionRange = document.querySelector(
      "#mark-selection-range",
    ).value;
    const requestType = document.querySelector("#mark-request-type").value;
    const markId = document.querySelector("#mark-id-form").value;

    const { date, time } = getCurrentDateAndTime();

    const requestData = {
      icon,
      url,
      title,
      date,
      time,
      groupId,
      scrollPosition,
      selectionRange,
      requestType,
      markId,
    };

    await browser.runtime.sendMessage({
      action: "handleMark",
      data: requestData,
    });

    fillMarkForm({});
    updateMarksList();
    popFromActivityStack();
  });

document
  .querySelector("#load-mark-btn")
  .addEventListener("click", async function () {
    const markData = savedMarksList[selectedMarkId];

    const newTab = await browser.tabs.create({ url: markData.url });

    browser.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === newTab.id && changeInfo.status === "complete") {
        browser.tabs.onUpdated.removeListener(listener);
        browser.tabs.sendMessage(newTab.id, {
          action: "loadPageMark",
          data: markData,
        });
      }
    });
  });

document.querySelector("#edit-mark-btn").addEventListener("click", function () {
  const { url, icon, title, scrollPosition, selectionRange, markId } =
    savedMarksList[selectedMarkId];

  fillMarkForm({
    url,
    icon,
    title,
    scrollPosition,
    selectionRange,
    markId,
    requestType: "edit",
  });

  openPanel(markFormPanelElement);
});

document
  .querySelector("#delete-mark-btn")
  .addEventListener("click", function () {
    showMessageBox({
      message: "Deleting selected mark. Are you sure?",
      onSubmit: async function () {
        await browser.runtime.sendMessage({
          action: "handleMark",
          data: { requestType: "delete", markId: selectedMarkId },
        });

        updateMarksList();
      },
    });
  });
