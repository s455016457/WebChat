/**
 * 对Array的扩展
 * var a=[{text:'aaaa'},{text:'bbb'}];
 * 
 * a.each(function(index,item){
	console.log(this);
	console.log(index);
	console.log(item);
	console.log("=======================")
   });
 * 
 * a.findItem(function(item){return item.text==='bb';});
 * a.findItems(function(item){return item.text==='bb';});
 * a.hasItem(function(item){return item.text==='bb';});
 * 
 */

(function (window) {
    /**
     * each循环
     * @param {any} fn 循环执行的方法
     */
    window.Array.prototype.each = function (fn) {
        if (!fn) return;
        if (typeof fn !== "function")
            throw "过滤器filterFn必须为方法！";
        for (var i = 0; i < this.length; i++) {
            fn.call(this, i, this[i]);
        }
    };

    /**
     * 根据过滤器查找数组中的元素
     * @param {funcion} filterFn 过滤器
     * @returns 如果存在，返回元素
     */
    window.Array.prototype.findItem = function (filterFn) {
        if (!filterFn) return;
        if (typeof filterFn !== "function")
            throw "过滤器filterFn必须为方法！";
        for (var i = 0; i < this.length; i++) {
            var item = this[i];
            if (filterFn.call(this, item)) return item;
        }
    };
    /**
     * 根据过滤器查找数组中的元素
     * @param {funcion} filterFn 过滤器
     * @returns 返回找到的元素数组
     */
    window.Array.prototype.findItems = function (filterFn) {
        var temp = [];
        if (!filterFn) return;
        if (typeof filterFn !== "function")
            throw "过滤器filterFn必须为方法！";
        for (var i = 0; i < this.length; i++) {
            var item = this[i];
            if (filterFn.call(this, item)) temp.push(item);
        }
        return temp;
    };
    /**
     *  根据过滤器查找数组中是否存在元素
     * @param {Function} filterFn 过滤器
     * @returns boolen 存在元素返回true 不存在返回false
     */
    window.Array.prototype.hasItem = function (filterFn) {
        if (this.findItem(filterFn))
            return true;
        return false;
    };
})(window);

