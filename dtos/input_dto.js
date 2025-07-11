class InputDto {
    static labelList_A = ["id", "플랫폼 명", "파일 명", "상품번호", "주문번호", "받는사람", "전화번호1", "전화번호2", "우편번호", "주소", "상품명1", "상품상세1", "수량(A타입)", "배송메시지", "운임구분", "운임", "운송장번호"]
    static labelList_B = ["id", "플랫폼 명", "파일 명", "상품번호", "주문번호", "보내는사람(지정)", "전화번호1(지정)", "전화번호2(지정)", "우편번호(지정)", "주소(지정)", "받는사람", "전화번호1", "전화번호2", "우편번호", "주소",
        "상품명1", "상품상세1", "수량(A타입)", "배송메시지", "운임구분", "운임", "운송장번호"]
    static labelList_C = ["id", "플랫폼 명", "파일 명", "상품번호", "주문번호","받는사람","전화번호1","전화번호2","우편번호","주소","수량(A타입)","배송메시지","운임구분","운임","운송장번호","상품코드1",
        "상품명1","상품상세1","상품코드2","상품명2","상품상세2","상품코드3","상품명3","상품상세3","상품코드4","상품명4","상품상세4","상품코드5","상품명5","상품상세5"]

    static labelEmpty_A = ["운임구분", "운임", "운송장번호"]


    constructor(params, type) {
        this._dtoData = [];
        this._type = type;


        switch (this._type) {
            case "A":
                this.inputData(InputDto.labelList_A, params)
                break;
            case "B":
                this.inputData(InputDto.labelList_B, params)
                break;
            case "C":
                this.inputData(InputDto.labelList_C, params)
                break;
        }
    }

    inputData(labelList, params) {
        labelList.forEach((item) => {
            if(params[item] == null)
                this._dtoData.push(null);
            else
                this._dtoData.push(params[item]);
        })
    }

    get dtoData() {
        return this._dtoData;
    }

    get id() {
        return this._dtoData[0];
    }


    get type() {
        return this._type;
    }

    get labelList() {
        switch (this._type) {
            case "A":
                return InputDto.labelList_A.slice(1)
            case "B":
                return InputDto.labelList_B.slice(1)
            case "C":
                return InputDto.labelList_C.slice(1)
        }
    }

    static getLabelListByTypetoUseExcel(type) {
        const sliceIndex = 4;

        switch (type) {
            case "A":
                return InputDto.labelList_A.slice(sliceIndex)
            case "B":
                return InputDto.labelList_B.slice(sliceIndex)
            case "C":
                return InputDto.labelList_C.slice(sliceIndex)
        }
    }

    static isEmptyLabel(type, label) {
        switch (type) {
            case "A":
                return InputDto.labelEmpty_A.indexOf(label) >= 0;
            // case "B":
            //     return InputDto.labelList_B.slice(sliceIndex)
            // case "C":
            //     return InputDto.labelList_C.slice(sliceIndex)
        }
    }


    static getLabel(type, findLabel) {
        const labelList = this.getLabelListByTypetoUseExcel(type);

        for(const label of labelList) {
            if(label.indexOf(findLabel) !== -1) {
                return label;
            }
        }

        return null;
    }
}

module.exports = InputDto;