"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeighborhoodsController = void 0;
const common_1 = require("@nestjs/common");
const neighborhoods_service_1 = require("./neighborhoods.service");
let NeighborhoodsController = class NeighborhoodsController {
    neighborhoodsService;
    constructor(neighborhoodsService) {
        this.neighborhoodsService = neighborhoodsService;
    }
    async getRankings(lat, lng, radius) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius) || 5;
        return this.neighborhoodsService.getRankings(latitude, longitude, radiusKm);
    }
    findAll() {
        return this.neighborhoodsService.findAll();
    }
};
exports.NeighborhoodsController = NeighborhoodsController;
__decorate([
    (0, common_1.Get)('rankings'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], NeighborhoodsController.prototype, "getRankings", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NeighborhoodsController.prototype, "findAll", null);
exports.NeighborhoodsController = NeighborhoodsController = __decorate([
    (0, common_1.Controller)('neighborhoods'),
    __metadata("design:paramtypes", [neighborhoods_service_1.NeighborhoodsService])
], NeighborhoodsController);
//# sourceMappingURL=neighborhoods.controller.js.map