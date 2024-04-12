class MarkStorage {
  static async getAll() {
    const queryResponse = await browser.storage.local.get("savedPageMarks");
    return queryResponse.savedPageMarks || [];
  }

  static async setAll(marks) {
    await browser.storage.local.set({ savedPageMarks: marks });
  }

  static generateIdForList(key = "id", list) {
    const length = list.length;
    if (length == 0) return 0;
    return list[length - 1][key] + 1;
  }

  static async add({
    icon,
    url,
    title,
    date,
    time,
    groupId,
    scrollPosition,
    selectionRange,
  }) {
    const marks = await this.getAll();
    const markId = this.generateIdForList("markId", marks);
    marks.push({
      markId,
      icon,
      url,
      title,
      date,
      time,
      groupId,
      scrollPosition,
      selectionRange,
    });
    await this.setAll(marks);
  }

  static async update(
    markId,
    { icon, url, title, date, time, groupId, scrollPosition, selectionRange },
  ) {
    const marks = await this.getAll();
    const newMarks = marks.map((mark) => {
      if (mark.markId == markId) {
        return {
          markId,
          icon,
          url,
          title,
          date,
          time,
          groupId,
          scrollPosition,
          selectionRange,
        };
      }
      return mark;
    });
    await this.setAll(newMarks);
  }

  static async remove(markId) {
    const marks = await this.getAll();
    const newMarks = marks.filter((mark) => mark.markId != markId);
    await this.setAll(newMarks);
  }

  static async addGroup(name) {}
  static async updateGroup(groupId, name) {}
  static async removeGroup(groupId) {}
}

async function handleMark(markData) {
  if (markData.requestType == "add") await MarkStorage.add(markData);
  else if (markData.requestType == "edit")
    await MarkStorage.update(markData.markId, markData);
  else if (markData.requestType == "delete")
    await MarkStorage.remove(markData.markId);
  else console.log("[background.js]: Invalid Mark Request!!!");
}

function handleGroup({ requestType, name, groupId }) {
  if (requestType == "add") MarkStorage.addGroup(name);
  else if (requestType == "edit") MarkStorage.updateGroup(groupId, name);
  else if (requestType == "delete") MarkStorage.removeGroup(groupId);
  else console.log("[background.js]: Invalid Group Request!!!");
}

function onMarkPageItemClick(info, tab) {
  console.log("Clicked on menu item");
}

browser.contextMenus.create({
  id: "markPageItem",
  title: "Mark current page",
  contexts: ["all"],
});

browser.contextMenus.onClicked.addListener(onMarkPageItemClick);

browser.runtime.onMessage.addListener(async function ({ action, data }) {
  switch (action) {
    case "handleMark":
      await handleMark(data);
      break;
    case "getMarks":
      return { data: JSON.stringify(await MarkStorage.getAll()) };
    case "handleGroup":
      handleGroup(data);
      break;
    default:
      console.log("[background.js]: Invalid Action!!!");
  }
});
