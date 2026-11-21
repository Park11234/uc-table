// 48번(2026-11-01): `npm run typecheck`(tsc --checkJs)가 앱 코드에서 모르는 이름으로 보는 브라우저·앱 바깥 객체.
// 실제 모양을 다 적지 않고 앱이 쓰는 만큼만 적는다(라이브러리는 필요할 때 불러오므로 any).
interface UCTableAndroidBridge {
  hasMigrated(): boolean; peekMigrated(): string; takeMigrated(): string; wipeOld(): void;
  print(title?: string): void; setLogReminder(on: boolean, last?: any): void;
}
interface Window {
  UCTableAndroid?: UCTableAndroidBridge;          // 안드로이드 앱(WebView)이 넣는 다리
  claude?: { use(name: string): Promise<any> };  // claude.ai 아티팩트 실행 환경
  html2canvas?: any; jspdf?: any; ZXing?: any;   // vendor/ 라이브러리(그림 PDF·바코드)
  showDirectoryPicker?: (o?: object) => Promise<any>;
}
interface Navigator { standalone?: boolean }      // iOS 사파리 홈 화면 앱
interface ServiceWorkerRegistration { periodicSync?: { register(tag: string, o?: object): Promise<void>; unregister(tag: string): Promise<void> } }
declare const html2canvas: any;
declare const BarcodeDetector: any;
// 문서 전체에 거는 이벤트 처리(위임)는 target이 입력칸·버튼·링크 등 여러 가지라, 앱 코드에서는 입력칸 모양으로 본다.
type TargetEvent<E extends Event = Event> = E & { target: HTMLInputElement };
// 하루 예시 식단의 한 칸(samplePlan). 끼니마다 붙는 표시가 달라 대부분 선택 항목이다.
type Meal = { slot: string; title: string; items: any[]; rec: any[]; tip: string; refs: number[]; key?: string; cook?: any[]; vi?: number;
  med?: number; user?: number; off?: number; empty?: boolean; snack?: number; side?: string; caAdd?: number; tip2?: string; brown?: number; vegX?: number; mult?: number };
