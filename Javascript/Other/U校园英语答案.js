// ==UserScript==
// @name         U校园英语网课答案显示
// @namespace    askar882
// @version      1.0
// @description  小窗口显示U校园板块测试答案，不支持单元测试
// @author       askar882
// @license      MIT
// @compatible   Chrome
// @match        *://ucontent.unipus.cn/_pc_default/pc.html?*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const wrapperId = "answerWrapper"
    const titleId = "answerTitle"
    const contentId = "answerContent"
    const innerText = html => {
        let div = document.createElement('div')
        div.innerHTML = html
        return div.firstChild.innerText
    }
    const knownQuestionKeys = [
        "questions:shortanswer",
        "shortanswer:shortanswer",
        "questions:scoopquestions",
        "questions:sequence",
        "questions:questions"
    ]
    const answerResolvers = [
        json => {
            let answer = ""
            json.questions.forEach(question => {
                answer += `\n${innerText(question.analysis.html)}`
            })
            return answer
        },
        json => {
            return innerText(json.analysis.html)
        },
        json => {
            let answer = ""
            json.questions.forEach(question => {
                answer += `\n${innerText(question.content.html)} ${question.answers.join(" | ")}`
            })
            return answer
        },
        json => {
            return json.questions.map(question => question.answer).join(", ")
        },
        json => {
            return json.questions.map(question => question.answers[0]).join(", ")
        }
    ]
    const specialQuestions = [
        /^content_\d:questions$/,
    ]
    const specialAnswerResolvers = [
        json => {
            let resolver = answerResolvers[knownQuestionKeys.indexOf("questions:questions")]
            return Object.keys(json).sort().map((key, index) => (index+1) + ". " + resolver(json[key])).join('\n')
        },
    ]
    const showAnswer = json => {
        let answer = "No answer found"
        let isQuestion = true
        if (json != null && json.hasOwnProperty("content")) {
            let contentJson = JSON.parse(json.content)
            console.log("%c%s", "color: red; font-size: 16px;", JSON.stringify(contentJson, '', 2))
            let keys = Object.keys(contentJson)
            let key = keys[0]
            let keyIndex = knownQuestionKeys.indexOf(key)
            if (keyIndex !== -1) {
                answer = answerResolvers[keyIndex](contentJson[key])
            } else {
                let specialKeyIndex = -1
                specialQuestions.forEach((pattern, index) => {
                    if (pattern.test(key)) {
                        specialKeyIndex = index
                    }
                })
                if (specialKeyIndex !== -1) {
                    answer = specialAnswerResolvers[specialKeyIndex](contentJson)
                } else {
                    answer = "Not a question\n" + JSON.stringify(contentJson, '', 2)
                    isQuestion = false
                }
            }
        }
        let title = "参考答案"
        let wrapperElem = document.getElementById(wrapperId)
        let titleElem = document.getElementById(titleId)
        let contentElem = document.getElementById(contentId)
        if (wrapperElem !== null) {
            titleElem.innerText = title
            contentElem.innerText = answer
            wrapperElem.style.visibility = isQuestion ? "visible" : "hidden"
            return
        }
        if (!isQuestion) {
            return
        }
        wrapperElem = document.createElement("div")
        titleElem = document.createElement("div")
        contentElem = document.createElement("div")
        wrapperElem.setAttribute("id", wrapperId)
        titleElem.setAttribute("id", titleId)
        contentElem.setAttribute("id", contentId)
        wrapperElem.setAttribute("style",
                             "top: 100px; left: 100px; margin: 0 auto; z-index: 1024; border-radius: 4px;"
                             + " box-shadow: 0 11px 15px -7px rgba(0,0,0,.2), 0 24px 38px 3px rgba(0,0,0,.14), 0 9px 46px 8px rgba(0,0,0,.12);"
                             + " position: absolute; background: #fff; width: 250px; max-height: 400px; min-height: 200px;")
        titleElem.setAttribute("style", "background: inherit; height: 25px; margin-top: 10px; text-align: center; font-size: x-large")
        contentElem.setAttribute("style", "margin: 10px; color: orange; font-size: medium; overflow-y: auto; max-height: 375px")
        titleElem.innerText = title
        contentElem.innerText = answer
        makeDraggable(titleElem)
        wrapperElem.appendChild(titleElem)
        wrapperElem.appendChild(contentElem)
        document.body.appendChild(wrapperElem)
    }
    const real_fetch = window.fetch
    window.fetch = (url, init=null) => real_fetch(url, init).then(response => {
            if (/.*\/course\/api\/content\//.test(url)) {
                let res = response.clone()
                res.json().then(showAnswer)
            }
            return response
    })
    function makeDraggable (elem) {
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