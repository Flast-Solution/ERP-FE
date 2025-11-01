/**************************************************************************/
/*  index.js                                                              */
/**************************************************************************/
/*                       Tệp này là một phần của:                         */
/*                             Open CDP                                   */
/*                        https://flast.vn                                */
/**************************************************************************/
/* Bản quyền (c) 2025 - này thuộc về các cộng tác viên Flast Solution     */
/* (xem AUTHORS.md).                                                      */
/* Bản quyền (c) 2024-2025 Long Huu, Quang Duc, Hung Bui                  */
/*                                                                        */
/* Bạn được quyền sử dụng phần mềm này miễn phí cho bất kỳ mục đích nào,  */
/* bao gồm sao chép, sửa đổi, phân phối, bán lại…                         */
/*                                                                        */
/* Chỉ cần giữ nguyên thông tin bản quyền và nội dung giấy phép này trong */
/* các bản sao.                                                           */
/*                                                                        */
/* Đội ngũ phát triển mong rằng phần mềm được sử dụng đúng mục đích và    */
/* có trách nghiệm                                                        */
/**************************************************************************/

const theme = {
  palette: {
    primary: '#FFC015',
    lightPrimary: '#3D95F8',
    secondary: '#37D494',
    tertiary: '#B4B4BD',
    loadingBackgroundColor: '#2c3e51cc',
    color: ['#788195', '#E4E6E9', '#1f2933'],
  },
  fonts: {
    primary: 'Open Sans',
  },
  fontWeight: {
    thin: 100,
    utraLight: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    heavy: 800,
    black: 900,
  },
  background: {
    container: '#f5f7fa',
    content: '#fff',
    input: '#F4F5FB',
    disabled: '#969696',
    headerTable: '#fff',
    backgroundPage: '#f5f7fa',
    notSeenNoti: '#f0cf6c26',
    clearBtn: '#f6eed7',
    calenderHeader: '#fffcf4',
    activeInbox: '#f7f3e3',
    linkedContract: 'rgba(245, 243, 253, 0.62)',
    disabledBtn: '#E4E7F2',
  },
  text: {
    primaryButtonTextColor: '#ffffff',
    primary: '#161724',
    text: '#1f2933',
    lightPrimary: '#3e4c59',
    secondary: '#91929c',
    tabTitle: '#262626',
    empty: '#969696',
    highlight: '#FFC015',
    disabled: '#969696',
    formLabel: '#4a4a4a',
    headerTable: '#1f2933',
    textLayout: '#fff',
    borderColor: '#b7b6c2',
    grey86: '#868E96',
    greyAD: '#ADB5BD',
    mainL1: '#0D0A03',
    mainL2: '#454545',
    placeholder: 'rgba(0, 0, 0, 0.45)',
    disabledBtn: '#B1B7CC',
    grey2: '#45445F',
    grey3: '#7A7A9D',
    grey4: '#B1B7CC',
    grey5: '#ECEFFA',
    grey6: '#F7F9FF',
  },
  border: {
    color: '#FFC015',
    default: '#d4d2f450',
    light: '#f2f2f2',
    headerTable: '#e8e8e8',
    checkboxInner: '#dbdbe0',
    secondary: '#F0EEE9',
    whiteLilac: '#E9ECF7',
    sun: '#FFB710',
  },
  borderRadius: {
    default: '8px',
    card: '8px',
    checkbox: '4px',
    modal: '10px',
  },
  scrollbar: {
    thumb: '#cac9d0',
    track: '#f0f3fa',
    shadow: '#d9d8dd',
  },
  color: {
    gray: '#a3a3a3',
    green: '#4fcea2',
    greenDark: '#29ca92',
    red: '#f4504f',
    blue: '#209dff',
    orange: '#fd9b5b',
    orangeDark: '#ff8c00',
    outrageousOrange: '#FF6940',
    orangeOpacity: '#f9e7cb',
    blueOpacity: 'rgba(32,157, 255, 0.08)',
    redOpacity: '#f9e0de',
    greenOpacity: '#ddf9df',
    pink: '#F75D81',
    limeGreen: '#4fcea2',
    lightGreen: '#3ebac2',
    blueShade: '#2d7fd3',
    yellow: '#FFCA28',
    violet: '#665ca7',
    white: '#FFFFFF',
    cyan: '#00ffff',
    blueSecondary: '#32A4FC',
    infoDefault: '#5487F5',
    success: '#00C48C',
    error: '#F74360',
    alert: '#F1B422',
    deepCove: '#070632',
    shamrock: '#50D2A0',
    macaroniAndCheese: '#FFB46E',
    bittersweet: '#FF5F5F',
    dodgerBlue: '#4B9BFF',
    candlelight: '#FFCD17',
    catskillWhite: '#EDF2F7',
    blackSqueeze: '#F7FAFC',
    black: '#000000',
    jade: '#00AF54',
    viking: '#6CC2D6',
    jungleGreen: '#299C9B',
    cerulean: '#0E96EB',
    eastBay: '#3D5A80',
    froly: '#F96F93',
    hollywoodCerise: '#D1008C',
    heliotrope: '#BB5CFF',
    persianGreen: '#00B6AA',
    denim: '#1071B1',
    wisteria: '#A563B8',
    hotPink: '#FF73C3',
    malibu: '#5FC8FF',
  },
  alert: {
    error: '#f4504f',
  },
  card: {
    header: '#d4d2f450',
  },
  table: {
    headerBackground: '#F1F1F5',
  },
  subscriptions: {
    colorIcon: '#faad14',
  },
  boxShadow: '0px 6px 64px rgba(0, 0, 0, 0.06)',
  drawer: {
    cancelBtnBg: '#F5F5F5',
  },
};

export default theme;
