//import { debounce } from 'lodash-es';

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

(hideMethod) => ({
    props: { delay: { type: Number, required: true } },
    data() {
        return {
            timeoutHide: () => {}
        }
    },
    methods: {
        cancelHide() {
            const hide = this.timeoutHide;

            if (hide && hide.cancel)
                this.timeoutHide.cancel();
        }
    },
    mounted() {
        this.timeoutHide = debounce(this[hideMethod], this.delay);
    }
})
