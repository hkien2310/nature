const fs = require('fs');
const path = require('path');

const targetsPath = path.join(__dirname, 'temp-targets.json');
const enrichPath = path.join(__dirname, 'temp-enrich.json');

if (!fs.existsSync(targetsPath)) {
  console.error("temp-targets.json not found!");
  process.exit(1);
}

const fileData = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
const targets = fileData.targets;

console.log(`Processing enrichment for ${targets.length} targets...`);

const enriched = targets.map(c => {
  const newC = { ...c };
  newC.enrichment_count = (c.enrichment_count || 0) + 1;

  if (c.id === 'portuguese-man-o-war') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "giáp xác nhỏ", "ấu trùng cá", "tôm nhỏ", "phiêu sinh động vật"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 3;
    newC.lifespan_max = 12;
    newC.lifespan_unit = 'months';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Quần thể sứa giải phóng giao tử trực tiếp vào cột nước biển để thụ tinh chéo. Phôi phát triển thành phân thể phao khí pneumatophore đầu tiên, sau đó nhân bản vô tính liên tục các zooids chuyên biệt khác để tạo thành siêu quần thể hoàn chỉnh.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 2.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 90.0;
    newC.size_max_mm = 300.0;
    newC.weight_avg_g = 500.0;

    newC.characteristics = (c.characteristics || "") + " Khả năng thay đổi áp suất khí bằng cách xả bớt khí qua một lỗ nhỏ khí khổng pneumatophore cho phép phao nổi tự chìm tạm thời dưới mặt nước để né tránh các tác động cơ học trực tiếp của bão lớn đại dương.";
    newC.survival_method = (c.survival_method || "") + " Hệ thống dactylozooids có các thụ thể nhạy cảm hóa học và cơ học đặc biệt, cho phép phát hiện con mồi lướt qua ngay lập tức và tự động kích hoạt phản xạ phóng gai châm không thông qua xử lý thần kinh trung ương.";
    newC.unique_traits = (c.unique_traits || "") + " Các zooids tiêu hóa gastrozooid có thể tiết ra hỗn hợp enzyme phân giải protein cực mạnh có tên là proteases, cho phép chúng tiêu hóa hoàn toàn con mồi lớn hơn nhiều lần kích thước của từng cá thể đơn lẻ.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1371/journal.pone.0249070",
        "label": "PLOS ONE - Distribution and toxicology of Physalia physalis in world oceans"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Từng xúc tu bị đứt lìa vẫn có thể co rút cơ học độc lập và châm độc trong vòng nhiều ngày nếu được giữ ẩm trong nước biển."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng co giãn xúc tu linh hoạt từ vài cm đến hơn 30 mét giúp quét sạch vùng không gian rộng lớn mà không tốn năng lượng di chuyển."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Lớp phao khí rất mỏng và dễ bị đâm thủng bởi rác thải nhựa sắc nhọn hoặc gai san hô trôi nổi."
    ];

  } else if (c.id === 'portuguese-man-of-war') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "giáp xác nhỏ", "ấu trùng cá", "tôm nhỏ", "phiêu sinh động vật"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 3;
    newC.lifespan_max = 12;
    newC.lifespan_unit = 'months';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Quần thể sứa giải phóng giao tử trực tiếp vào cột nước biển để thụ tinh chéo. Phôi phát triển thành phân thể phao khí pneumatophore đầu tiên, sau đó nhân bản vô tính liên tục các zooids chuyên biệt khác để tạo thành siêu quần thể hoàn chỉnh.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 2.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 90.0;
    newC.size_max_mm = 300.0;
    newC.weight_avg_g = 400.0;

    newC.characteristics = (c.characteristics || "") + " Lớp màng nhầy kỵ nước phủ trên phao khí nổi giúp giảm sức cản của nước và ngăn cản sự phát triển của vi khuẩn hay sinh vật bám dính gây tăng trọng lượng quần thể.";
    newC.survival_method = (c.survival_method || "") + " Hệ thống dactylozooids tự động kích hoạt phản xạ phóng gai châm nematocyst nhờ áp suất nội bào khổng lồ tích lũy trước đó, không phụ thuộc vào dòng xung thần kinh từ não bộ.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng điều phối sinh học cấp cao xóa nhòa ranh giới giữa một cá thể độc lập và siêu quần thể cộng sinh tương hỗ sinh tồn.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/j.1469-7998.1989.tb05027.x",
        "label": "Journal of Zoology - Mechanics and hydrodynamics of the Portuguese man-of-war"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Nọc độc sứa lửa chứa phức chất protein physalitoxin, có thể giữ nguyên hoạt tính sinh học ngay cả khi phơi khô dưới ánh nắng mặt trời nhiều giờ liền."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Cơ chế phóng gai châm nematocyst tạo áp lực lên tới 150 atmosphere, xuyên thủng lớp vảy mỏng của các loài cá nhỏ."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Rất nhạy cảm với sự sụt giảm độ mặn đột ngột khi trôi dạt vào các cửa sông nước ngọt lớn sau các cơn bão."
    ];

  } else if (c.id === 'red-bellied-piranha') {
    newC.diet_type = 'omnivore';
    newC.diet_items = ["cá nhỏ", "giáp xác", "côn trùng", "giun", "thực vật thủy sinh", "hạt quả", "xác thối động vật"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 8;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính, đẻ trứng. Vào mùa mưa ngập, con cái đẻ khoảng 5.000 trứng dính chắc vào các rễ cây thủy sinh. Cả hai bố mẹ thay phiên nhau canh gác hung dữ và quạt nước cung cấp oxy cho trứng.';
    newC.locomotion = 'swim';
    newC.speed_max = 25.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 150.0;
    newC.size_max_mm = 350.0;
    newC.weight_avg_g = 1250.0;

    newC.characteristics = (c.characteristics || "") + " Hệ thống cơ xương hàm dưới có khớp khóa cơ học đặc thù, giúp hấp thụ hoàn toàn phản lực từ các cú đớp tốc độ cao để ngăn chặn chấn thương não bộ.";
    newC.survival_method = (c.survival_method || "") + " Hệ thống đường bên (lateral line) phát triển cực kỳ nhạy bén giúp nhận diện tần số rung động nhỏ nhất của con mồi bị thương trong môi trường nước đục ngầu sông Amazon.";
    newC.unique_traits = (c.unique_traits || "") + " Khả năng rụng và mọc lại toàn bộ răng một bên hàm cùng lúc (chu kỳ thay răng luân phiên) để đảm bảo luôn sở hữu bộ vũ khí sắc bén nhất.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1038/srep01009",
        "label": "Scientific Reports - Mega-bites: Extreme biting capabilities of piranhas"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Chúng có thể phát ra các tần số âm thanh khác nhau bằng cách rung cơ bong bóng cá để cảnh báo đồng loại về mức độ nguy hiểm xung quanh."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Lực cắn nén ép cơ học tương đương 320 Newton đột biến giúp bẻ gãy các gai xương cứng của con mồi chỉ trong chớp mắt."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Bị suy giảm khả năng định vị và phối hợp săn bầy rõ rệt khi hàm lượng oxy hòa tan trong nước hạ xuống mức cực thấp vào đỉnh điểm mùa khô."
    ];

  } else if (c.id === 'red-lipped-batfish') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nhỏ", "cua nhỏ", "tôm nhỏ", "nhuyễn thể", "giáp xác nhỏ", "giun biển"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 5;
    newC.lifespan_max = 10;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính. Trứng được thụ tinh ngoài, trôi nổi tự do trong cột nước biển khơi rộng lớn trước khi nở thành ấu trùng có khả năng bơi lội, sau đó biến thái chìm xuống đáy cát.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 1.5;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 200.0;
    newC.size_max_mm = 250.0;
    newC.weight_avg_g = 300.0;

    newC.characteristics = (c.characteristics || "") + " Da cá dơi môi đỏ được bao phủ bởi các nốt gai kitin hóa rất cứng cáp, bảo vệ chúng khỏi các đòn tấn công vật lý của các loài săn mồi nhỏ vùng rạn san hô.";
    newC.survival_method = (c.survival_method || "") + " Cơ chế nhử mồi esca tiết dịch hóa học thu hút đặc hiệu các sinh vật giáp xác nhỏ tự tìm đến miệng cá mà không cần cá dơi tốn năng lượng rình rập.";
    newC.unique_traits = (c.unique_traits || "") + " Hệ cơ và cấu trúc khớp của vây ngực/vây bụng biến đổi hoàn hảo chịu được tải trọng cơ thể để nâng đỡ toàn thân đứng thẳng đi bộ trên nền cát.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.darwinfoundation.org/en/datazone/checklist?species=7201",
        "label": "Charles Darwin Foundation - Ogcocephalus darwini Species Profile"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Để bù đắp khả năng bơi kém, cá dơi môi đỏ có bong bóng cá rất nhỏ nhằm duy trì độ nổi âm, giúp chúng luôn bám chặt dưới đáy cát biển."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Khả năng ngụy trang vật lý tiệp màu cát đáy biển tuyệt vời giúp lẩn tránh sự chú ý của các loài cá mập rạn san hô lớn."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Dễ bị tổn thương nghiêm trọng nếu cấu trúc cần câu sinh học illicium bị đứt hoặc bị ký sinh trùng ăn mòn."
    ];

  } else if (c.id === 'redback-spider') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["côn trùng", "nhện khác", "thằn lằn nhỏ", "chuột nhắt con", "ốc sên"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 1;
    newC.lifespan_max = 3;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'oviparous';
    newC.reproduction_notes = 'Sinh sản hữu tính. Nhện cái đẻ từ 4-10 kén trứng chứa hàng trăm quả trứng mỗi kén. Tập tính giao phối hiến sinh cực đoan khi con đực chủ động đưa bụng vào răng độc của con cái để bị ăn thịt nhằm kéo dài thời gian thụ tinh.';
    newC.locomotion = 'crawl';
    newC.speed_max = 0.1;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 3.0;
    newC.size_max_mm = 10.0;
    newC.weight_avg_g = 0.3;

    newC.characteristics = (c.characteristics || "") + " Con cái sở hữu cơ quan lưu trữ tinh trùng (spermathecae) cho phép thụ tinh cho nhiều lứa trứng liên tiếp trong vòng hai năm chỉ sau một lần giao phối thành công.";
    newC.survival_method = (c.survival_method || "") + " Khả năng chưng cất và cô đặc nọc độc alpha-latrotoxin ở tuyến độc sừng giúp vô hiệu hóa lập tức các con mồi có kích thước gấp 50 lần nhện.";
    newC.unique_traits = (c.unique_traits || "") + " Hệ thống tơ bẫy mồi được bọc lớp keo glycoprotein siêu bền vững, chống chịu được sự phân hủy của nước mưa và tia cực tím mặt trời.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.australian.museum/learn/animals/spiders/redback-spider/",
        "label": "Australian Museum - Redback Spider Biology and Distribution"
      }
    ];

    newC.fun_facts = [
      ...(c.fun_facts || []),
      "Nhện con lưng đỏ sau khi nở có thể phóng ra các sợi tơ dài đón gió để bay xa hàng kilômét tìm vùng đất mới (ballooning)."
    ];

    newC.strengths = [
      ...(c.strengths || []),
      "Nọc độc thần kinh Alpha-latrotoxin cực mạnh gây tê liệt khớp thần kinh cơ của động vật xương sống nhanh chóng."
    ];

    newC.weaknesses = [
      ...(c.weaknesses || []),
      "Khả năng di chuyển tự thân vô cùng chậm chạp và vụng về nếu bị tách rời khỏi hệ thống mạng lưới tơ bẫy mồi."
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
