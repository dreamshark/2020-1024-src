 dd = 0.2; //将残差下降到这个数值以下，就认为过关

    cfa = document.getElementById("father"); //之所以有两个canvas，是为了提高绘图效率，需拟合的绘制在一个画布上，而玩家画在另一个画布上，两画布叠加。
    canv = document.getElementById("gc");
    ctx = canv.getContext("2d");
    canv2 = document.getElementById("gc2");
    ctx2 = canv2.getContext("2d");
    ined = document.getElementById("ed");
    bu = document.getElementById("bu");
    mes = document.getElementById("mes");
    outm = document.getElementById("outm");

    x = 0.1;
    y = 0.1; //x,y的初始值，设置为0应该也行，但为了防止bug就找一个接近0的数
    size = Math.min(window.innerWidth, window.innerHeight) * 0.65; //根据页面尺寸调整画布
    cfa.style.width = size + "px";
    cfa.style.height = size + "px";
    canv.width = size;
    canv.height = size; //说实话这代码写的烂的我自己都看不下去了:)
    canv2.width = size;
    canv2.height = size;

    levels = ["x", "x^2", "x<0", "0.1/x", "abs(x)", "abs(x^3)", "sin(10x)<10y", "sin(PI*x)", "exp(E*x)",
        "x%0.2>y", "sqrt(0.5-x^2)", "x^2+x", "x^2+y^2<0.5", "ceil(x*10)/10", "x^3+0.3*x^2-0.5*x-0.3",
        "x^10+y^10<0.1", "tan(x^2*3.8)", "ceil(x*10)/10+floor(x*10)/10", "min(x^2-x,x)",
        "sin(x)^2+sin(y)^2<0.5", "tan(x)^2+tan(y)^2<0.5", "sin(10x+0.3sin(1000x))", "log(E*x)", "gamma(10x)/10",
        "x mod 0.4", "x^x", "pow(x^3,x)", "abs(sin(x))",
        "((2x)^2+(2y)^2-1)^3<(2x)^2(2y)^3", "x*y<0", "x*y<0.1", "x<-0.2 or x>0.2", "-0.8<x<0.2", "-0.2<x<y<0.2",
        "(abs(x)-0.5)^2+y^2<0.1",
        "abs(sin(x^2*5))", "max(x%0.2,sin(10*PI*x))", "gamma(abs(x)*10)/10", "max(sin(x*10)/10,cos(x*10)/10)",
        "log(abs(x*5)-0.1)/5", "x%(0.2)+sin(x*10)/10",
        "max(0,x)", "max(0.1x,x)", "sign(sin(x*10))/10", "atan(x*1.5)", "tanh(x*1.5)", "1/(1+e^(-x*10))",
        "sign(sin(x*1000))/2",
        "0.1sin(10x)+0.2sin(20x)+0.3sin(30x)+0.4sin(40x)", "abs(x)+abs(y)<0.5",
        "sin(10x)%1-0.5", "0.2*isPrime(ceil(x*20))", "norm(cos(i*10x))/10", "gcd(6,ceil(10*x))/10",
        "sin(PI*(x+sin(x*1000)))"
    ]; //每个关卡的表达式

    ses = [
        [-2000, 2000],
        [-2000, 2000],
        [],
        [-100, 100],
        [-2000, 2000],
        [-2000, 2000],
        [],
        [100, 4100],
        [-2000, 2000],
        [],
        [-800, 800],
        [-2000, 2000],
        [],
        [2001, 6001],
        [-2000, 2000],
        [],
        [-2000, 2000],
        [-3001, 1001],
        [-2000, 2000],
        [],
        [],
        [-2000, 2000],
        [-100, 4100],
        [-1000, 1000],
        [-2000, 2000],
        [0, 4000],
        [0, 4000],
        [-2000, 2000],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [-2000, 2000],
        [-2000, 2000],
        [-300, -200],
        [-2000, 2000],
        [2000, 6000],
        [-2000, 2000],
        [-2000, 2000],
        [-2000, 2000],
        [-2000, 2000],
        [-2000, 2000],
        [-2000, 2000],
        [-2000, 2000],
        [-2000, 2000],
        [-2000, 2000],
        [],
        [-2000, 2000],
        [0, 4000],
        [-500, 500],
        [-2000, 2000],
        [-2000, 2000]
    ]; //这是计算残差时的取样区间，不过只适用于函数，而不等式用的是另一种计算残差的方法，所以不等式对应的区间为空
    qab = 0;
    qa = 0;
    qb = 0;
    //这三个量是当表达式为不等式时，拟合平面区域所用
    //qa是玩家绘制区域的采样数，qb是关卡的采样数，qab是玩家与关卡相同的采样数

    ltype = "";
    lvn = 0;
    score = 0;
    R = Infinity;

    reCanvas2();
    reCanvas();
    nextLevel();
    ined.value = "((2x)^2+(2y)^2-1)^3<(2x)^2(2y)^3"; //初始画面
    plot(ined.value, "red", "boolean"); //绘制输入框里的表达式，红色，不等式为boolean，函数为number

    function reMes() { //刷新右下角的提示
        mes.innerHTML = "关卡：" + lvn + "；得分：" + score + "；当前残差：" + R;
    }

    function nextLevel() {
        lvn += 1; //关卡数+1
        x = 0.1;
        y = 0.1; //初始化
        qab = 0;
        qa = 0;
        qb = 0; //q
        if (R != Infinity && !isNaN(R)) { //因为残差R要小于要求dd才能过关，所以得分就取1e5*(dd-R)的整数部分
            score += Math.trunc(1e5 * (dd - R));
        }
        R = Infinity; //利用无穷大比任何数字都大的特性
        ined.value = ""; //清空
        outm.innerHTML = "";
        if (lvn > levels.length) { //判断是否完成所有关卡
            /*玩家通过！！！！！！！！！！！！！！！！！！！！！！*/
            alert("你已通关！你的平均得分是" + score / levels.length + "分（满分20000）。flag: 1db8d352466b5e5b");
            /*玩家通过！！！！！！！！！！！！！！！！！！！！！！*/
            return;
        }
        reCanvas2();
        reCanvas();
        plot2(levels[lvn - 1])
    }

    function buOnClick() {
        nextLevel();
        bu.disabled = true; //禁用按钮
        bu.style.border = "1px solid red";
    }

    function reCanvas() {
        canv.width = canv.width; //这是清空画布的骚操作
        bu.disabled = true;
        R = Infinity;
        bu.style.border = "1px solid red";
        reMes();
    }

    function reCanvas2() {
        canv2.width = canv2.width; //这是清空画布的骚操作
        ctx2.strokeStyle = 'gray';
        ctx2.moveTo(size / 2, 0);
        ctx2.lineTo(size / 2, size);
        ctx2.moveTo(0, size / 2);
        ctx2.lineTo(size, size / 2);
        ctx2.stroke();
    }

    function plot(ex, color, type) { //利用了math.js库进行表达式运算
        comp = math.compile(ex);
        reCanvas();
        ctx.fillStyle = color;
        if (type == "boolean") {
            comp2 = math.compile(levels[lvn - 1]); //先编译表达式，可以提升后面连续计算的效率
            jd = size / 200;
            for (var i = 0; i <= size; i += jd) {
                for (var j = 0; j <= size; j += jd) {
                    x = (2 * i - size) / size;
                    y = -(2 * j - size) / size;
                    ans = comp.evaluate({
                        x: x,
                        y: y
                    });
                    if (ans == true) {
                        ctx.fillRect(i, j, jd / 2, jd / 2);
                        qb += 1;
                        if (comp2.evaluate({
                                x: x,
                                y: y
                            }) == true) {
                            qab += 1;
                        }
                    }
                }
            }
            if (ltype != "boolean") {
                R = Infinity;
            } else {
                R = parseFloat((Math.tan(0.5 * Math.PI * (1 - qab / (qa + qb - qab))) / 2).toFixed(
                    6)); //并集与补集中元素个数只比，这个比值越接近1，拟合程度越好，离1越远
                if (R > 1e8) {
                    R = Infinity;
                } //拟合程度越差，所以用1减去它，再利用正切函数的特性，将其映射到0到正无穷
                qab = 0;
                qb = 0;
            }
            judge();
        } else if (type == "number") {
            for (var i = -10 * size; i <= 10 * size; i++) {
                x = i / (10 * size);
                y = comp.evaluate({
                    x: x,
                    y: y
                });
                if (typeof y != "number" || y > 1 || y < -1 || isNaN(y)) {
                    continue;
                }
                ctx.fillRect((x + 1) * 0.5 * size - 1, (1 - y) * size * 0.5 - 1, 2, 2);
            }
            if (ltype != "number") {
                R = Infinity;
            } else {
                R = parseFloat(calR(ex, levels[lvn - 1]).toFixed(6));
            }
            judge();
        }
    }

    function judge() { //裁判是否完成目标
        reMes();
        if (R < dd) { //把isNaN(R)去掉，防止跳关
            bu.disabled = false;
            bu.style.border = "1px solid green";
        } else {
            bu.disabled = true;
            bu.style.border = "1px solid red";
        }
    }

    function calR(ex, ex2) { //当为函数时计算残差的方法
        r = 0;
        comp = math.compile(ex);
        comp2 = math.compile(ex2);
        start = ses[lvn - 1][0]; //取样区间
        end = ses[lvn - 1][1];
        for (var i = start; i <= end; i++) {
            x = i / 2000;
            y1 = comp.evaluate({
                x: x,
                y: y
            });
            y2 = comp2.evaluate({
                x: x,
                y: y
            });
            if (typeof y2 != "number") {
                continue;
            }
            if (y2 == -Infinity || y2 == Infinity || isNaN(y1)) {
                continue;
            }
            r += Math.abs(y1 - y2); //就是|Δy|之和，当然也可以用Δy^2之和，没什么区别
        }
        return r / (end - start); //还要除以取样区间长度，相当于单位区间下的差距，可以作为拟合的好坏
    }

    function plot2(ex) {
        comp = math.compile(ex);
        outeval = comp.evaluate({
            x: x,
            y: y
        });
        ltype = typeof outeval;
        ctx2.fillStyle = "gray";
        if (ltype == "boolean") {
            jd = size / 200;
            for (var i = 0; i <= size; i += jd) {
                for (var j = 0; j <= size; j += jd) {
                    x = (2 * i - size) / size;
                    y = -(2 * j - size) / size;
                    if (comp.evaluate({
                            x: x,
                            y: y
                        }) == true) {
                        ctx2.fillRect(i, j, jd / 2, jd / 2);
                        qa += 1;
                    }
                }
            }
        } else if (ltype == "number") {
            for (var i = -10 * size; i <= 10 * size; i++) {
                x = i / (10 * size);
                y = comp.evaluate({
                    x: x,
                    y: y
                });
                if (typeof y != "number" || y > 1 || y < -1) {
                    continue;
                }
                ctx2.fillRect((x + 1) * 0.5 * size - 1, (1 - y) * size * 0.5 - 1, 2, 2);
            }
        }
    }

    function inChange() {
        if (ined.value == "") {
            reCanvas();
            outm.innerHTML = "";
            return;
        }
        x = 0.1;
        y = 0.1;
        try {
            outeval = math.evaluate(ined.value);
            type = typeof outeval;
            if (type != "function") {
                outm.innerHTML = outeval;
            } else {
                outm.innerHTML = "function";
            }
        } catch (err) {
            outm.innerHTML = "";
            try {
                outeval = math.evaluate(ined.value, {
                    x: x,
                    y: y
                });
            } catch (err) {
                outeval = Infinity;
            }
            type = typeof outeval;
        }
        if (ined.value == "0/0" || ined.value == "NaN") { //跳关
        } else if (Math.abs(outeval) == Infinity && type != "object") { //跳关
        } else {
            plot(ined.value, "blue", type);
        }
    }

    ined.addEventListener('keydown', function (e) { //回车进入下一关
        if (e.keyCode == 13) {
            e.preventDefault();
            if (bu.disabled) {
                inChange();
            } else {
                bu.click();
            }
        }
        return;
    });