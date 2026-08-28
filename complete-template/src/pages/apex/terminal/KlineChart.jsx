import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

function KlineChart({ candles, live }) {
	const wrapRef = useRef(null);
	const seriesRef = useRef(null);
	const chartRef = useRef(null);

	useEffect(() => {
		if (!wrapRef.current) return undefined;
		const chart = createChart(wrapRef.current, {
			layout: {
				background: { type: ColorType.Solid, color: 'transparent' },
				textColor: '#868BA1',
			},
			grid: { vertLines: { color: '#DEE2E655' }, horzLines: { color: '#DEE2E655' } },
			width: wrapRef.current.clientWidth,
			height: 420,
			timeScale: { timeVisible: true, secondsVisible: false },
		});
		const series = chart.addCandlestickSeries({
			upColor: '#4CAF50',
			downColor: '#D32F2F',
			borderVisible: false,
			wickUpColor: '#4CAF50',
			wickDownColor: '#D32F2F',
		});
		chartRef.current = chart;
		seriesRef.current = series;
		const onResize = () => {
			if (wrapRef.current) chart.applyOptions({ width: wrapRef.current.clientWidth });
		};
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
			chart.remove();
		};
	}, []);

	useEffect(() => {
		if (seriesRef.current && candles?.length) {
			seriesRef.current.setData(candles);
			chartRef.current?.timeScale().fitContent();
		}
	}, [candles]);

	useEffect(() => {
		if (seriesRef.current && live) {
			seriesRef.current.update(live);
		}
	}, [live]);

	return <div ref={wrapRef} style={{ width: '100%' }} />;
}

export default KlineChart;
