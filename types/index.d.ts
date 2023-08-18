/**
 * pointMax 打点抵达临界值的时候触发
 */
type ErrorType = "pointMax";
type CrsType = "wgs84" | "gcj02" | "bd09";
type DrawType = "point" | "polygon" | "polyline";

interface DrawPointOptions {
    map?: any;
    muti?: boolean;
    value?: [number, number][];
    onChange?: (value: [number, number][]) => void;
    crs?: CrsType;
    maxPoint?: number;
    onError?: (type: ErrorType, err: any) => void;
}

interface drawStyle {
    color?: string;
    opacity?: number;
}
interface polygonStyle extends drawStyle {
}
interface lineStyle extends drawStyle {
    width?: number;
    type?: 'solid' | 'dashed';
}
interface DrawPolygonOptions {
    map?: any;
    crs?: CrsType;
    style?: {
        lineStyle?: lineStyle;
        polygonStyle?: polygonStyle;
    };
    value?: GeoJSON.FeatureCollection;
    onChange?: (value: GeoJSON.FeatureCollection | undefined) => void;
}

declare class DrawMapLeaflet {
    options: DrawMapLeafletOptions;
    mapInstance: any;
    constructor(options: DrawMapLeafletOptions);
    init(): Promise<void>;
    /**
     * 初始化地图
     */
    initMap(): void;
    /**
     * 导入样式和js文件
     */
    importScriptAndStyle(): Promise<unknown>;
    createCssTextAndImport(): void;
}
interface DrawMapLeafletOptions {
    el: HTMLElement | null;
    drawType: DrawType;
    mapOptions?: {
        center?: [number, number];
        zoom?: number;
        [key: string]: any;
    };
    addTitleUrl?: (map: any) => void;
    crs?: CrsType;
    pointOptions?: DrawPointOptions;
    onChange?: (data: [number, number][] | GeoJSON.FeatureCollection | undefined) => void;
    onError?: (eventName: ErrorType, message: string) => void;
    drawOptions?: DrawPolygonOptions;
}

export { type DrawMapLeafletOptions, DrawMapLeaflet as default };
