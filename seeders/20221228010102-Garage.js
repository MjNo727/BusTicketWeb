'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    const items = [
      { garage_name: 'Phương Trang', logo:'https://futa.vn/wp-content/uploads/2020/11/vato-app.png', garage_image:'https://thuexedulichnhatrang.vn/Media/Upload/xe-phuong-trang-1.jpg', title:'PHƯƠNG TRANG - "Chất lượng là danh dự"', location:'Takashimaya @ TP. Hồ Chí Minh',date:'2022/12/20', information:'Thành lập 10/2022, V.exe với mục tiêu mang đến nhứng chuyến xe an toàn cho mọi người đi đến mọi nơi, mọi miền tổ quốc. V.exe tự hào là đơn vị đi đầu trong sự nghiệp cách mạng ngành xe khách và du lịch Việt Nam bao gồm các giải pháp: đặt vé & phương tiện thông minh cho hành khách, phần mềm quản lý hiệu quả cho nhà xe (BMS - Bus Management System) và phần mềm hỗ trợ bán vé hiệu quả cho đại lý (AMS- Agent Management System).', achievement:'Hiện tại, V.exe là hệ thống vé xe lớn nhất Việt Nam. Không chỉ mang đến cho người dùng đa dạng lựa chọn về hãng xe, dòng xe và giải pháp đặt vé nhanh chóng, tiện lợi, VeXeRe còn có rất nhiều ưu đãi hàng tháng, giúp khách hàng đặt được vé xe khách chất lượng cao với giá thấp nhất thị trường. Hành khách có thể dễ dàng lựa chọn trước chỗ ngồi yêu thích, thanh toán vé trực tuyến, hoặc bằng tiền mặt tại các cửa hàng tiện lợi trên cả nước. Phần mềm quản lý hãng xe V.exe (BMS) đang được hơn 700 hãng xe cả nước tin dùng. Phần mềm hỗ trợ các nhà xe thay đổi hình thức quản lý thủ công để quản lý hiệu quả và tối ưu hóa doanh thu, giảm thiểu chi phí, và tăng doanh thu từ mạng lưới đại lý rộng lớn nhất cả nước. Đây là cuộc cách mạng trong việc công nghệ hóa ngành xe khách. Phần mềm hỗ trợ đại lý bán vé AMS có hơn 5.000 đại lý sử dụng, giúp tăng doanh thu bán vé của đại lý và giúp đại lý hỗ trợ chăm sóc khách tốt hơn.', rate:4.5, phone_number:'19006067' },
      { garage_name: 'Lạc Hồng', logo:'https://cdn.oto360.net/images/bus/logo/LACHONGLIMOUSINE.webp', garage_image:'https://lachonglimo.com/wp-content/uploads/2022/01/lac-hong-16.jpeg', title:'Lạc Hồng Limousine đi Đà Lạt – Sài Gòn', location:'Takashimaya @ TP. Hồ Chí Minh',date:'2020/10/20', information:'Chúng tôi tạo dựng nên những giá trị mới cho dịch vụ Vận chuyển hành khách và Xe hợp đồng. Cùng với đội ngũ nhân viên chuyên nghiệp, giàu kinh nghiệm trong lĩnh vực vận tải hành khách và hệ thống xe cao cấp từ dòng Ford, Hyundai đời mới nhất.', achievement:'Cùng với đội ngũ nhân viên chuyên nghiệp, giàu kinh nghiệm trong lĩnh vực vận tải hành khách và hệ thống xe cao cấp từ dòng Ford đời mới nhất.', rate:4.5, phone_number:'0967 835 875' }
    ];
    items.forEach(item => {
      item.createdAt = Sequelize.literal('NOW()');
      item.updatedAt = Sequelize.literal('NOW()');
    });
    await queryInterface.bulkInsert('Garages', items, {});
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
