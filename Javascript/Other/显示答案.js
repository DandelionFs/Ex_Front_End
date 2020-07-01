// ==UserScript==
// @name         U校园答案++
// @namespace    ludoux
// @version      5.0
// @description  [Archived] 曾经捐赠>=1元的同学请看描述
// @author       ludoux
// @license      MIT
// @compatible   Chrome
// @compatible   Firefox
// @match        *://ucontent.unipus.cn/_pc_default/pc.html?*
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://code.jquery.com/jquery-3.5.0.min.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    var auto
    var randomBase
    var randomMin
    var randomMax
    auto = GM_getValue('auto', true)
    randomBase = GM_getValue('randomBase', 6341)
    randomMin = GM_getValue('randomMin', 1147)
    randomMax = GM_getValue('randomMax', 8475)
    var answerNetLoadFlag = false//答案网页资源
    const wrapperId = "answerWrapper"
    const titleId = "answerTitle"
    const contentId = "answerContent"
    const configId = "answerConfig"
    const innerText = html => {
        let div = document.createElement('div')
        div.innerHTML = html
        return div.firstChild.innerText
    }

    const knownQuestionKeys = [
        "questions:shortanswer",//大填空（长篇
        "shortanswer:shortanswer",
        "questions:scoopquestions",//小填空
        "questions:sequence",//排序
        "questions:questions",//选择（多选、单选）、也可能是填空题目
        "questions:scoopselection",//下拉
        "questions:textmatch",//大意填空（长篇
        "questions:bankedcloze"//单填空，视听说选填A-E
    ]
    const real_fetch = unsafeWindow.fetch
    unsafeWindow.fetch = (url, init = null) => real_fetch(url, init).then(response => {//先load再切
        if (/.*\/course\/api\/v3\/content\//.test(url)) {
            let title = "答案++"
            let wrapperElem = document.getElementById(wrapperId)
            let titleElem = document.getElementById(titleId)
            let contentElem = document.getElementById(contentId)
            let configElem = document.getElementById(configId)
            let br = document.createElement("br");
            let infoElem = document.createElement("a")
            let timeElem = document.createElement("p")
            let autoCheckbox = document.createElement("input")
            timeElem.setAttribute("id", 'timeE')
            autoCheckbox.setAttribute("type", "checkbox")
            autoCheckbox.setAttribute("id", 'autoCheckbox')
            infoElem.setAttribute("href", "https://greasyfork.org/zh-CN/scripts/397423")
            infoElem.setAttribute("target", "_blank")
            infoElem.text = "👉(397423),捐赠>=1元同学请进👈"
            if (wrapperElem !== null) {
                return response
            }
            wrapperElem = document.createElement("div")
            titleElem = document.createElement("div")
            contentElem = document.createElement("div")
            configElem = document.createElement("div")
            wrapperElem.setAttribute("id", wrapperId)
            titleElem.setAttribute("id", titleId)
            contentElem.setAttribute("id", contentId)
            wrapperElem.setAttribute("style",
                "top: 100px; left: 100px; margin: 0 auto; z-index: 1024; border-radius: 4px;"
                + " box-shadow: 0 11px 15px -7px rgba(0,0,0,.2), 0 24px 38px 3px rgba(0,0,0,.14), 0 9px 46px 8px rgba(0,0,0,.12);"
                + " position: absolute; background: #fff; width: 280px; max-height: 800px; min-height: 200px;")
            titleElem.setAttribute("style", "background: inherit; height: 25px; margin-top: 10px; text-align: center; font-size: x-large")
            contentElem.setAttribute("style", "margin: 10px; color: orange; font-size: medium; overflow-y: auto; max-height: 575px")
            titleElem.innerText = title
            contentElem.innerText = "本脚本已停更。捐赠>=1元的同学请点下方链接，你可以免费拿到最新的脚本，谢谢你的支持。"
            contentElem.appendChild(timeElem)
            contentElem.appendChild(infoElem)

            makeDraggable(titleElem)
            wrapperElem.appendChild(titleElem)
            wrapperElem.appendChild(contentElem)
            document.body.appendChild(wrapperElem)
        }
        if (/.*\/api\/mobile\//.test(url)) {//api/mobile/ 会弹两次不想管了（可以用一个flag
            //setTimeout(function(){
            //if(!answerNetLoadFlag)
            //{alert('Ctrl+F5, please.')}
            //},500)
        }
        return response
    })
    function answerAnalysis(json) {
        let answerNetType = 0//指网页回传回来的
        let isQuestion = true
        let answer
        let key
        if (json != null) {
            key = Object.keys(json)[0]

            answerNetType = knownQuestionKeys.indexOf(key) + 1//从1开始计算
            if (answerNetType == 0) {//无找到，本来有一个special的处理，v3删去了
                isQuestion = false
            }
        }
        setTimeout(function () {//等待页面加载完，因为要确定answerSheetType
            answerNetLoadFlag = false
            let jsonx = json[key]
            let formatAns
            let stringAns
            let answerSheetType = 0//1单选，2多选，3小填空，4大填空（式1），5大意填空（textmatch），6单填空

            if (document.querySelectorAll('input[name^="single-"]').length > 0) {
                answerSheetType = 1
            }
            else if (document.querySelectorAll('input[class^="MultipleChoice--checkbox-"]').length > 0) {
                answerSheetType = 2
            }
            else if (document.querySelectorAll('input[class^="fill-blank--bc-input"]').length > 0) {
                answerSheetType = 3
            }
            else if (document.querySelectorAll('textarea[class^="writing--textarea"]').length > 0) {
                answerSheetType = 4
            }
            else if (document.querySelectorAll('div[class^="cloze-text-pc--fill-blank"]').length > 0) {
                answerSheetType = 5
            }
            else if (document.querySelectorAll('input[class^="cloze-text-pc--bc-input"]').length > 0) {
                answerSheetType = 6
            }
            console.log('answerNetType:' + answerNetType + ',answerSheetType:' + answerSheetType)
            if (answerSheetType == 1 && answerNetType == 5) {//真单选
                formatAns = jsonx.questions.map(question => question.answers[0].replace(' ', ''))
                if (auto) {
                    for (let index in formatAns) {

                        setTimeout(function () { doCheckbox(document.getElementsByName("single-" + (Number(index) + 1))[formatAns[index].charCodeAt() - 65]) }, (Number(index) + 1) * (randomBase + Math.floor(Math.random() * (randomMax - randomMin + 1)) + randomMin))
                    }
                }
            } else if (answerSheetType == 2 && answerNetType == 5) {//多选
                formatAns = jsonx.questions.map(question => JSON.stringify(question.answers).replace(new RegExp('[\\]\[\"]', "gm"), "").replace(new RegExp(',', "gm"), ''))//.join("\n")
                if (auto) {
                    for (let queIndex in formatAns) {
                        for (let index in formatAns[queIndex]) {
                            setTimeout(function () { doCheckbox(document.getElementsByName("multichoice-" + (Number(queIndex) + 1))[formatAns[queIndex][index].charCodeAt() - 65]) }, (Number(index) + 1) * (randomBase + Math.floor(Math.random() * (randomMax - randomMin + 1)) + randomMin))
                        }
                    }
                }
            } else if (answerSheetType == 3 && answerNetType == 5) {//假单选，真填空
                formatAns = jsonx.questions.map(question => question.answers[0])
                if (auto) {
                    let e = document.querySelectorAll('input[class^="fill-blank--bc-input"]')
                    for (let index in formatAns) {
                        setTimeout(function () { doInput(e[index], formatAns[index]) }, (Number(index) + 1) * (randomBase + Math.floor(Math.random() * (randomMax - randomMin + 1)) + randomMin))
                    }
                }
            } else if (answerSheetType == 3 && answerNetType == 3) {//真填空
                formatAns = jsonx.questions.map(question => question.answers.join(" | "))
                if (auto) {
                    let e = document.querySelectorAll('input[class^="fill-blank--bc-input"]')
                    for (let index in formatAns) {
                        setTimeout(function () { doInput(e[index], formatAns[index].match(new RegExp("^.+?(?= \\||$)", "gm"))[0]) }, (Number(index) + 1) * (randomBase + Math.floor(Math.random() * (randomMax - randomMin + 1)) + randomMin))
                    }
                }
            } else if (answerSheetType == 4 && answerNetType == 1) {//大填空，会闪
                formatAns = jsonx.questions.map(question => question.analysis.html.replace(new RegExp('(<.+?>\\d+\\. )|<.+?>', "gm"), '').replace(new RegExp('&.{1,6}?;', "gm"), ''))
                if (auto) {
                    let e = document.querySelectorAll('textarea[class^="writing--textarea"]')
                    for (let index in formatAns) {
                        setTimeout(function () { doInput(e[index], formatAns[index]) }, (Number(index) + 1) * (randomBase + Math.floor(Math.random() * (randomMax - randomMin + 1)) + randomMin))
                    }
                }
            } else if (answerSheetType == 5 && answerNetType == 7) {//大意填空
                formatAns = jsonx.questions.map(question => question.answer.replace(' ', ''))
                let e = document.querySelectorAll('div[class^="cloze-text-pc--fill-blank"]')
                if (auto) {
                    for (let index in formatAns) {
                        setTimeout(function () { doInput(e[index].firstElementChild, formatAns[index]) }, (Number(index) + 1) * (randomBase + Math.floor(Math.random() * (randomMax - randomMin + 1)) + randomMin))
                    }
                }
            } else if (answerSheetType == 6 && answerNetType == 8) {//单填空
                formatAns = jsonx.questions.map(question => question.answer.replace(' ', ''))
                let e = document.querySelectorAll('input[class^="cloze-text-pc--bc-input"]')
                if (auto) {
                    for (let index in formatAns) {
                        setTimeout(function () { doInput(e[index], formatAns[index]) }, (Number(index) + 1) * (randomBase + Math.floor(Math.random() * (randomMax - randomMin + 1)) + randomMin))
                    }
                }
            } else if (answerSheetType == 0 && answerNetType == 2) {//没遇到过
                stringAns = innerText(jsonx.analysis.html)
            } else if (answerSheetType == 0 && answerNetType == 4) {//排序，忘了哪里的了answerSheetType为默认，这个自动不了
                formatAns = jsonx.questions.map(question => question.answer)
            } else if (answerSheetType == 0 && answerNetType == 6) {//下拉，同上
                formatAns = jsonx.questions.map(question => question.answers[0])
            }
            if ((stringAns == null || stringAns == undefined || stringAns == '')) {
                stringAns = formatAns.join(", ")
            }
            if (document.querySelectorAll('div[class^=objective-report-info-pc').length > 0) {
                stringAns += '\n>[已作答]<'
            }
            let title = "答案++"
            let wrapperElem = document.getElementById(wrapperId)
            let titleElem = document.getElementById(titleId)
            let contentElem = document.getElementById(contentId)
            let configElem = document.getElementById(configId)
            let br = document.createElement("br");
            let infoElem = document.createElement("a")
            let timeElem = document.createElement("p")
            let autoCheckbox = document.createElement("input")
            timeElem.setAttribute("id", 'timeE')
            autoCheckbox.setAttribute("type", "checkbox")
            autoCheckbox.setAttribute("id", 'autoCheckbox')
            //let donateElem = document.createElement("a")
            infoElem.setAttribute("href", "https://greasyfork.org/zh-CN/scripts/397423")
            infoElem.setAttribute("target", "_blank")
            infoElem.text = "👉(397423),常更新哟👈"
            if (wrapperElem !== null) {
                titleElem.innerText = title
                contentElem.innerText = stringAns + '\n\n'
                contentElem.appendChild(timeElem)
                contentElem.appendChild(infoElem)
                wrapperElem.style.visibility = isQuestion ? "visible" : "hidden"
                return
            }
            if (!isQuestion) {
                return
            }
            wrapperElem = document.createElement("div")
            titleElem = document.createElement("div")
            contentElem = document.createElement("div")
            configElem = document.createElement("div")
            wrapperElem.setAttribute("id", wrapperId)
            titleElem.setAttribute("id", titleId)
            contentElem.setAttribute("id", contentId)
            wrapperElem.setAttribute("style",
                "top: 100px; left: 100px; margin: 0 auto; z-index: 1024; border-radius: 4px;"
                + " box-shadow: 0 11px 15px -7px rgba(0,0,0,.2), 0 24px 38px 3px rgba(0,0,0,.14), 0 9px 46px 8px rgba(0,0,0,.12);"
                + " position: absolute; background: #fff; width: 250px; max-height: 800px; min-height: 200px;")
            titleElem.setAttribute("style", "background: inherit; height: 25px; margin-top: 10px; text-align: center; font-size: x-large")
            contentElem.setAttribute("style", "margin: 10px; color: orange; font-size: medium; overflow-y: auto; max-height: 575px")
            configElem.setAttribute("style", "margin: 10px; color: orange; font-size: medium; overflow-y: auto; max-height: 575px")
            titleElem.innerText = title
            contentElem.innerText = stringAns + '\n\n'
            contentElem.appendChild(timeElem)
            contentElem.appendChild(infoElem)
            configElem.innerHTML = '<li><label><input id="auto" type="checkbox">自动填题</label></li>'
                + '<li><label>r_Base(6341): <input id="randomBase" type="text" style="width:40px;"></label></li>'
                + '<li><label>r_Min(1147): <input id="randomMin" type="text" style="width:40px;"></label></li>'
                + '<li><label>r_Max(8475): <input id="randomMax" type="text" style="width:40px;"></label></li>'
                + '<li><button id="savebutton" type="button">Save</button></li>'

            makeDraggable(titleElem)
            wrapperElem.appendChild(titleElem)
            wrapperElem.appendChild(contentElem)
            wrapperElem.appendChild(configElem)
            document.body.appendChild(wrapperElem)
            document.querySelector("#auto").checked = auto
            document.querySelector("#randomBase").value = randomBase
            document.querySelector("#randomMin").value = randomMin
            document.querySelector("#randomMax").value = randomMax
            document.querySelector("#savebutton").addEventListener("click", function () {
                GM_setValue('auto', document.querySelector("#auto").checked)
                GM_setValue('randomBase', Number(document.querySelector("#randomBase").value))
                GM_setValue('randomMin', Number(document.querySelector("#randomMin").value))
                GM_setValue('randomMax', Number(document.querySelector("#randomMax").value))
                alert('请 [Ctrl+F5] 刷新看看保存了没有...')
            })
        }, 1000)
    }
    function doInput(dom, st) {
        $(dom).trigger('click')
        $(dom).trigger('focus')
        $(dom).trigger('keydown')
        $(dom).trigger('input')
        if (/input/i.test(dom.tagName)) {
            var setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
            setValue.call(dom, st)
            var e = new Event('input', { bubbles: true })
            dom.dispatchEvent(e)
        } else {
            var evt = new InputEvent('input', {
                inputType: 'insertText',
                data: st,
                dataTransfer: null,
                isComposing: false
            })
            dom.value = st
            dom.dispatchEvent(evt)
        }
        $(dom).trigger('keyup')
        $(dom).trigger('change')
        $(dom).trigger('blur')
    }
    function doCheckbox(dom) {
        if (!dom.checked) {
            dom.click()
        }
    }
    function makeDraggable(elem) {
        document.mouseState = 'up'
        elem.mouseState = 'up'
        elem.lastMousePosY = null
        elem.lastMousePosX = null
        elem.proposedNewPosY = parseInt(elem.style.top, 10)
        elem.proposedNewPosX = parseInt(elem.style.left, 10)
        document.onmousedown = _ => {
            document.mouseState = 'down'
        }

        document.onmouseup = _ => {
            document.mouseState = 'up'
            elem.mouseState = 'up'
        }
        elem.onmousedown = e => {
            elem.lastMousePosY = e.pageY
            elem.lastMousePosX = e.pageX
            elem.mouseState = 'down'
            document.mouseState = 'down'
            document.onselectstart = e => {
                e.preventDefault()
                return false
            }
        }
        elem.onmouseup = e => {
            elem.mouseState = 'up'
            document.mouseState = 'up'
            document.onselectstart = null
        }
        const getAtInt = (obj, attrib) => parseInt(obj.style[attrib], 10)
        document.onmousemove = e => {
            if ((document.mouseState === 'down') && (elem.mouseState === 'down')) {
                elem.proposedNewPosY = getAtInt(elem.parentElement, 'top') + e.pageY - elem.lastMousePosY
                elem.proposedNewPosX = getAtInt(elem.parentElement, 'left') + e.pageX - elem.lastMousePosX
                if (elem.proposedNewPosY < 0) {
                    elem.parentElement.style.top = "0px"
                } else if (elem.proposedNewPosY > window.innerHeight - getAtInt(elem.parentElement, 'height')) {
                    elem.parentElement.style.top = window.innerHeight - getAtInt(elem.parentElement, 'height') + 'px'
                } else {
                    elem.parentElement.style.top = elem.proposedNewPosY + 'px'
                }
                if (elem.proposedNewPosX < 0) {
                    elem.parentElement.style.left = "0px"
                } else if (elem.proposedNewPosX > window.innerWidth - getAtInt(elem.parentElement, 'width')) {
                    elem.parentElement.style.left = window.innerWidth - getAtInt(elem.parentElement, 'width') + 'px'
                } else {
                    elem.parentElement.style.left = elem.proposedNewPosX + 'px'
                }
                elem.lastMousePosY = e.pageY
                elem.lastMousePosX = e.pageX
            }
        }
    }
})();