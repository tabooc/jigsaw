/*
    拼图小游戏
*/
var zIndex = 1;

window.onload = function() {
    var oPhoto = document.getElementById("photo");
    var aThumb = oPhoto.getElementsByTagName("img");
    var oBox = document.getElementById("box");
    var oLayoutBox = document.getElementById("J_layoutBox");
    var aLi = oBox.getElementsByTagName("li");
    var oInput = document.getElementsByTagName("input")[0];
    var i = 0;
    var imgPath = 0;
    var oDateStart = null;
    var aPos = [];
    var aData = [];

    for (i = 0; i < 15; i++) aData.push(i + 1);

    //缩略图
    for (i = 0; i < aThumb.length; i++) {
        aThumb[i].index = i;
        aThumb[i].onmouseover = function() {
            this.className += " hover"
        };
        aThumb[i].onmouseout = function() {
            this.className = this.className.replace(/\shover/, "")
        };
        aThumb[i].onclick = function() {
            for (i = 0; i < aThumb.length; i++) aThumb[i].className = "";
            this.className = "selected";
            imgPath = this.index;
            oBox.innerHTML = "";
            oInput.value = "开始游戏";
            createMask();
            aData.sort(function(a, b) {
                return a - b
            });
            GAME(false)
        }
    }

    //创建遮罩层
    function createMask() {
        if (document.getElementById('mask')) {
            return false;
        }
        var oMask = document.createElement("div");
        oMask.id = "mask";
        oMask.style.zIndex = zIndex;
        oLayoutBox.appendChild(oMask)
    }
    createMask();

    //游戏处理函数
    function GAME(ran) {
        //随机排列数组
        ran && aData.sort(function(a, b) {
            return Math.random() > 0.5 ? -1 : 1
        });
        //插入结构
        var oFragment = document.createDocumentFragment();
        var oLi, row, col;
        for (i = 0; i < aData.length; i++) {
            oLi = document.createElement("li");

            //使用background方式以减少http请求和减去图片切割步骤
            // var oImg = document.createElement("img");
            // oImg.src = config.imgPath + "img/girl" + imgPath + "/" + aData[i] + ".png";
            // oLi.appendChild(oImg);
            row = parseInt((aData[i] - 1) / 5);
            col = parseInt((aData[i] - 1) % 5);

            oLi.style.backgroundImage = 'url(' + config.imgPath + 'img/girl' + imgPath + '/girl.png)';
            oLi.style.backgroundPosition = '-' + col * 82 + 'px -' + row * 190 + 'px';
            oLi.setAttribute('data-index', aData[i]);
            oFragment.appendChild(oLi)
        }
        oBox.appendChild(oFragment);
        oBox.style.background = "url(" + config.imgPath + "img/girl" + imgPath + "/bg.png)  no-repeat";

        //布局转换
        for (i = 0; i < aLi.length; i++) {
            aLi[i].index = i;
            aLi[i].style.top = aLi[i].offsetTop + "px";
            aLi[i].style.left = aLi[i].offsetLeft + "px";
            aPos.push({
                "left": aLi[i].offsetLeft,
                "top": aLi[i].offsetTop
            })
        }
        for (i = 0; i < aLi.length; i++) {
            aLi[i].style.position = "absolute";
            aLi[i].style.margin = "0";
            drag(aLi[i])
        }

        //拖拽函数
        function drag(obj, handle) {
            var handle = handle || obj;
            handle.style.cursor = "move";
            handle.onmousedown = function(event) {
                var event = event || window.event;
                var disX = event.clientX - this.offsetLeft;
                var disY = event.clientY - this.offsetTop;
                var oNear = null;
                obj.style.zIndex = zIndex++;
                document.onmousemove = function(event) {
                    var event = event || window.event;
                    var iL = event.clientX - disX;
                    var iT = event.clientY - disY;
                    var maxL = obj.parentNode.clientWidth - obj.offsetWidth;
                    var maxT = obj.parentNode.clientHeight - obj.offsetHeight;

                    iL < 0 && (iL = 0);
                    iT < 0 && (iT = 0);
                    iL > maxL && (iL = maxL);
                    iT > maxT && (iT = maxT);
                    obj.style.left = iL + "px";
                    obj.style.top = iT + "px";

                    for (i = 0; i < aLi.length; i++) aLi[i].className = "";

                    oNear = findNearest(obj);

                    oNear && (oNear.className = "hig");

                    return false
                };
                document.onmouseup = function() {
                    document.onmousemove = null;
                    document.onmouseup = null;
                    if (oNear) {
                        var tIndex = obj.index;
                        obj.index = oNear.index;
                        oNear.index = tIndex;
                        startMove(obj, aPos[obj.index]);
                        startMove(oNear, aPos[oNear.index], function() {
                            if (finish()) {
                                var iHour = iMin = iSec = 0;
                                var oDateNow = new Date();
                                var iRemain = parseInt((oDateNow.getTime() - oDateStart.getTime()) / 1000);

                                iHour = parseInt(iRemain / 3600);
                                iRemain %= 3600;
                                iMin = parseInt(iRemain / 60);
                                iRemain %= 60;
                                iSec = iRemain;

                                alert("\u606d\u559c\u60a8\uff0c\u62fc\u56fe\u5b8c\u6210\uff01\n\n\u7528\u65f6\uff1a" + iHour + "\u5c0f\u65f6" + iMin + "\u5206" + iSec + "\u79d2");
                                createMask();
                            }
                        });
                        oNear.className = "";
                    } else {
                        startMove(obj, aPos[obj.index])
                    }
                    handle.releaseCapture && handle.releaseCapture()
                };
                this.setCapture && this.setCapture();
                return false
            }
        }

        //找出相遇点中最近的元素
        function findNearest(obj) {
            var filterLi = [];
            var aDistance = [];

            for (i = 0; i < aLi.length; i++) aLi[i] != obj && (isButt(obj, aLi[i]) && (aDistance.push(getDistance(obj, aLi[i])), filterLi.push(aLi[i])));

            var minNum = Number.MAX_VALUE;
            var minLi = null;

            for (i = 0; i < aDistance.length; i++) aDistance[i] < minNum && (minNum = aDistance[i], minLi = filterLi[i]);

            return minLi
        }
    }
    GAME();

    //开始游戏
    oInput.onclick = function() {

        document.getElementById('mask') && oLayoutBox.removeChild(document.getElementById('mask'));
        oDateStart = new Date();
        oBox.innerHTML = "";
        this.value = "\u91cd\u65b0\u5f00\u59cb";
        GAME(true)
    };

    //判断是否完成
    function finish() {
        var aTemp = [];
        var success = true;
        aTemp.length = 0;
        for (i = 0; i < aLi.length; i++) {
            for (var j = 0; j < aLi.length; j++) {
                if (i == aLi[j]["index"]) {
                    // aTemp.push(aLi[j].getElementsByTagName("img")[0].src.match(/(\d+)\./)[1]);
                    aTemp.push(parseInt(aLi[j].getAttribute('data-index')));
                }
            }
        }
        for (i = 1; i <= aTemp.length; i++) {
            if (i != aTemp[i - 1]) {
                success = false;
                break
            }
        }
        return success
    }
};

//求两点之间的距离
function getDistance(obj1, obj2) {
    var a = (obj1.offsetLeft + obj1.offsetWidth / 2) - (obj2.offsetLeft + obj2.offsetWidth / 2);
    var b = (obj1.offsetTop + obj1.offsetHeight / 2) - (obj2.offsetTop + obj2.offsetHeight / 2);
    return Math.sqrt(a * a + b * b)
}

//碰撞检测
function isButt(obj1, obj2) {
    var l1 = obj1.offsetLeft;
    var t1 = obj1.offsetTop;
    var r1 = obj1.offsetLeft + obj1.offsetWidth;
    var b1 = obj1.offsetTop + obj1.offsetHeight;

    var l2 = obj2.offsetLeft;
    var t2 = obj2.offsetTop;
    var r2 = obj2.offsetLeft + obj2.offsetWidth;
    var b2 = obj2.offsetTop + obj2.offsetHeight;

    return !(r1 < l2 || b1 < t2 || r2 < l1 || b2 < t1)
}

//获取最终样式
function getStyle(obj, attr) {
    return parseFloat(obj.currentStyle ? obj.currentStyle[attr] : getComputedStyle(obj, null)[attr])
}

//运动框架
function startMove(obj, pos, onEnd) {
    clearInterval(obj.timer);
    obj.timer = setInterval(function() {
        doMove(obj, pos, onEnd)
    }, 30)
}

function doMove(obj, pos, onEnd) {
    var iCurL = getStyle(obj, "left");
    var iCurT = getStyle(obj, "top");
    var iSpeedL = (pos.left - iCurL) / 5;
    var iSpeedT = (pos.top - iCurT) / 5;
    iSpeedL = iSpeedL > 0 ? Math.ceil(iSpeedL) : Math.floor(iSpeedL);
    iSpeedT = iSpeedT > 0 ? Math.ceil(iSpeedT) : Math.floor(iSpeedT);
    if (pos.left == iCurL && pos.top == iCurT) {
        clearInterval(obj.timer);
        onEnd && onEnd()
    } else {
        obj.style.left = iCurL + iSpeedL + "px";
        obj.style.top = iCurT + iSpeedT + "px";
    }
}