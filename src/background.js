class AddOnStorage {
  static generateIdForList(list, key = "id") {
    const length = list.length;
    if (length == 0) return 1;
    return list[length - 1][key] + 1;
  }

  static async get(key) {
    const queryResponse = await browser.storage.local.get(key);
    return queryResponse[key] || [];
  }

  static async set(key, value) {
    await browser.storage.local.set({ [key]: value });
  }

  static async add(key, value, identifier = "id") {
    const data = await this.get(key);
    const id = this.generateIdForList(data, identifier);
    data.push({ [identifier]: id, ...value });
    await this.set(key, data);
  }

  static async update(key, id, value, identifier = "id") {
    const data = await this.get(key);
    const updatedData = data.map((record) => {
      if (record[identifier] == id) {
        return {
          [identifier]: id,
          ...value,
        };
      }
      return record;
    });
    await this.set(key, updatedData);
  }

  static async remove(key, id, identifier = "id") {
    const data = await this.get(key);
    const updatedData = data.filter((record) => record[identifier] != id);
    await this.set(key, updatedData);
  }
}

class MarkStorage extends AddOnStorage {
  static async getAll() {
    return await super.get("savedPageMarks");
  }

  static async setAll(marks) {
    await super.set("savedPageMarks", marks);
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
    await super.add("savedPageMarks", {
      icon,
      url,
      title,
      date,
      time,
      groupId,
      scrollPosition,
      selectionRange,
    });
  }

  static async update(
    id,
    { icon, url, title, date, time, groupId, scrollPosition, selectionRange },
  ) {
    await super.update("savedPageMarks", id, {
      icon,
      url,
      title,
      date,
      time,
      groupId,
      scrollPosition,
      selectionRange,
    });
  }

  static async remove(id) {
    await super.remove("savedPageMarks", id);
  }

  static async removeByGroupId(groupId) {
    const marks = await this.getAll();
    const filteredMarks = marks.filter(mark => mark.groupId != groupId);
    await this.setAll(filteredMarks);
  }
}

class GroupStorage extends AddOnStorage {
  static async getAll() {
    return await super.get("savedGroups");
  }

  static async setAll(groups) {
    await super.set("savedGroups", groups);
  }

  static async add(name) {
    await super.add("savedGroups", { name });
  }

  static async update(id, name) {
    await super.update("savedGroups", id, { name });
  }

  static async remove(id) {
    await MarkStorage.removeByGroupId(id);
    await super.remove("savedGroups", id);
  }
}

async function handleMark(markData) {
  if (markData.requestType == "add") await MarkStorage.add(markData);
  else if (markData.requestType == "edit")
    await MarkStorage.update(markData.id, markData);
  else if (markData.requestType == "delete")
    await MarkStorage.remove(markData.id);
  else console.log("[background.js]: Invalid Mark Request!!!");
}

async function handleGroup({ requestType, name, id }) {
  if (requestType == "add") GroupStorage.add(name);
  else if (requestType == "edit") GroupStorage.update(id, name);
  else if (requestType == "delete") GroupStorage.remove(id);
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
    case "getMarks":
      return { data: JSON.stringify(await MarkStorage.getAll()) };
    case "getGroups":
      return { data: JSON.stringify(await GroupStorage.getAll()) };
    case "handleMark":
      await handleMark(data);
      break;
    case "handleGroup":
      await handleGroup(data);
      break;
    default:
      console.log("[background.js]: Invalid Action!!!");
  }
});
