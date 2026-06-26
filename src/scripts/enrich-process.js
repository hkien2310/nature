const fs = require("fs");
const path = require("path");

const targetsPath = path.join(__dirname, "../../targets.json");
const outputPath = path.join(__dirname, "temp-enrich.json");

if (!fs.existsSync(targetsPath)) {
  console.error("targets.json not found!");
  process.exit(1);
}

const fileData = JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
const targets = fileData.targets;

const enrichments = {
  "leafcutter-ant": {
    diet_type: "herbivore",
    diet_items: [
      "Nấm ký sinh Leucocoprinus gongylophorus",
      "Nhựa thực vật",
      "Mật hoa dại",
      "Dịch tế bào lá cây"
    ],
    activity_pattern: "variable",
    lifespan_min: 1,
    lifespan_max: 15,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Chuyến bay giao phối (nuptial flight) diễn ra vào đầu mùa mưa. Kiến chúa giao phối một lần duy nhất với nhiều kiến đực, nhận lượng tinh trùng đủ để đẻ trứng thụ tinh suốt cuộc đời lên tới 15 năm. Kiến đực chết ngay sau khi giao phối.",
    locomotion: "walk",
    speed_max: 0.08,
    conservation_status: "LC",
    size_min_mm: 2,
    size_max_mm: 22,
    weight_avg_g: 0.03,
    additional_strengths: [
      "Khả năng sản xuất các hợp chất kháng sinh tự nhiên thông qua các tuyến trên cơ thể để ngăn chặn mầm bệnh phát triển trong tổ",
      "Cơ chế stridulation tạo ra rung động cơ học tần số cao giúp lưỡi cắt hoạt động như cưa máy siêu âm",
      "Hệ thống định vị bằng Pheromone cực kỳ tinh vi giúp điều phối hàng triệu cá thể di chuyển tối ưu"
    ],
    additional_weaknesses: [
      "Bị ký sinh bởi ruồi Apocephalus borealis (ruồi phorid) đẻ trứng trực tiếp lên đầu kiến thợ",
      "Hệ tiêu hóa thoái hóa không thể trực tiếp hấp thu xenlulozo từ lá cây mà phải qua nấm trung gian",
      "Phụ thuộc tuyệt đối vào nhiệt độ tổ ổn định từ 25-28 độ C để ấp cấy tế bào nấm nấm nảy mầm"
    ],
    additional_fun_facts: [
      "Kiến chúa lưu trữ sợi nấm gốc trong túi khoang miệng đặc biệt trước khi bay đi lập tổ mới",
      "Một tổ kiến cắt lá trưởng thành có cấu trúc ngầm di chuyển tới 40 tấn đất cát, tạo ra các buồng thông khí tự nhiên điều hòa vi khí hậu cực tốt",
      "Các kiến thợ nhỏ thường có nhiệm vụ liếm láp làm sạch lá cây để diệt các bào tử nấm dại có hại trước khi đem bón"
    ],
    additional_sources: [
      {
        url: "https://doi.org/10.1016/j.cub.2020.11.010",
        label: "Biomineral armor in leaf-cutter ants"
      },
      {
        url: "https://doi.org/10.1126/science.1054786",
        label: "Symbiotic microbes protect leaf-cutter ant gardens"
      }
    ]
  },
  "leafy-seadragon": {
    diet_type: "carnivore",
    diet_items: [
      "Tôm mysis",
      "Sinh vật phù du",
      "Ấu trùng cá rạn",
      "Giáp xác nhỏ"
    ],
    activity_pattern: "diurnal",
    lifespan_min: 7,
    lifespan_max: 10,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Con cái đẻ trứng màu hồng và chuyển sang vùng nếp da đặc biệt nằm ở gốc đuôi của con đực. Con đực thụ tinh và mang trứng (ấp trứng thụ động) trong 8-9 tuần cho đến khi trứng nở thành con non tự lập.",
    locomotion: "swim",
    speed_max: 0.15,
    conservation_status: "LC",
    size_min_mm: 300,
    size_max_mm: 350,
    weight_avg_g: 100,
    additional_strengths: [
      "Thị giác lập thể với hai mắt có thể chuyển động độc lập linh hoạt như tắc kè hoa",
      "Bộ xương ngoài bằng các tấm giáp cứng bảo vệ khỏi các va đập cơ học trong rạn đá ngầm",
      "Khả năng hấp thụ màu sắc và ánh sáng xuyên thấu qua các nhánh da mô phỏng hoàn toàn thực vật biển"
    ],
    additional_weaknesses: [
      "Không có dạ dày và răng, thức ăn đi qua mõm ống và tiêu hóa trực tiếp cực nhanh, đòi hỏi nạp mồi liên tục",
      "Cơ chế bơi rất yếu, dễ bị dòng nước xiết quật ngã hoặc dạt bờ tử vong",
      "Tỷ lệ tử vong của hải long con mới nở ngoài tự nhiên lên tới trên 95% do thiếu ngụy trang tốt"
    ],
    additional_fun_facts: [
      "Hải Long Lá là loài đặc hữu độc nhất chỉ phân bố tại vùng biển ôn đới phía Nam và Tây nước Úc",
      "Chúng không có cơ chế giữ đuôi bám vào tảo như cá ngựa, trôi tự do theo hướng dòng chảy cỏ biển",
      "Chúng là bậc thầy ngụy trang thụ động, thậm chí khi chuyển động chúng cũng lắc lư nhịp nhàng theo nhịp sóng để trông giống tảo"
    ],
    additional_sources: [
      {
        url: "https://doi.org/10.1186/s12983-021-00438-x",
        label: "Evolutionary genomic signatures of leafy seadragon"
      },
      {
        url: "https://www.iucnredlist.org/species/17096/115140685",
        label: "Phycodurus eques conservation status"
      }
    ]
  },
  "leopard-seal": {
    diet_type: "carnivore",
    diet_items: [
      "Chim cánh cụt hoàng đế",
      "Nhuyễn thể krill Nam Cực",
      "Hải cẩu con",
      "Mực",
      "Cá biển"
    ],
    activity_pattern: "variable",
    lifespan_min: 12,
    lifespan_max: 26,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Giao phối dưới nước vào mùa hè. Con cái mang thai khoảng 9 tháng và có cơ chế trì hoãn cấy phôi (delayed implantation) kéo dài 2-3 tháng để đảm bảo sinh con trên lớp băng nổi vào mùa hè Nam Cực.",
    locomotion: "swim",
    speed_max: 40,
    conservation_status: "LC",
    size_min_mm: 2400,
    size_max_mm: 3500,
    weight_avg_g: 400000,
    additional_strengths: [
      "Cơ thể thuôn dài khí động học vượt trội cùng các chi dạng vây ngực cực lớn tạo lực đẩy bơi lội mạnh mẽ",
      "Cơ hàm cực kỳ khỏe mạnh và linh hoạt cho phép thực hiện đồng thời việc xé thịt mồi lớn và lọc giáp xác nhỏ",
      "Lớp mỡ dưới da dày tới 10-15cm giúp duy trì nhiệt độ cơ thể ổn định trong điều kiện nước buốt giá -2 độ C"
    ],
    additional_weaknesses: [
      "Lối sống đơn độc cao độ, dễ xảy ra các cuộc xung đột bạo lực tranh giành lãnh thổ khốc liệt",
      "Khả năng di chuyển trên băng tuyết cạn rất chậm chạp do cấu trúc cơ thể thích nghi tối đa dưới nước",
      "Phụ thuộc nhiều vào diện tích băng nổi vững chắc để nghỉ ngơi và sinh đẻ"
    ],
    additional_fun_facts: [
      "Hải cẩu báo là loài thú biển duy nhất có hàm răng tích hợp mấu lọc nước thông minh giống như cá voi tấm sừng để ăn sinh vật nhỏ",
      "Chúng có thể hát dưới nước suốt nhiều giờ liền trong mùa sinh sản với tần số siêu trầm lan truyền đi rất xa",
      "Mỗi năm một con hải cẩu báo trưởng thành có thể tiêu thụ tới hơn 1 tấn chim cánh cụt làm thức ăn"
    ],
    additional_sources: [
      {
        url: "https://doi.org/10.1111/mms.12658",
        label: "Leopard seal feeding ecology and dentition"
      },
      {
        url: "https://doi.org/10.3354/meps094247",
        label: "Vocalizations and acoustic behavior of Hydrurga leptonyx"
      }
    ]
  },
  "lionfish": {
    diet_type: "carnivore",
    diet_items: [
      "Cá rạn san hô nhỏ",
      "Tôm biển",
      "Cua nhỏ",
      "Ấu trùng giáp xác"
    ],
    activity_pattern: "crepuscular",
    lifespan_min: 10,
    lifespan_max: 15,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Cá cái đẻ bọc chất nhầy chứa từ 15.000 đến 30.000 trứng nổi trên mặt nước biển sau mỗi vài ngày. Cá đực thụ tinh bên ngoài và trứng trôi theo dòng hải lưu cho đến khi nở.",
    locomotion: "swim",
    speed_max: 2,
    conservation_status: "LC",
    size_min_mm: 300,
    size_max_mm: 380,
    weight_avg_g: 1200,
    additional_strengths: [
      "Dạ dày có khả năng phình to gấp 30 lần thể tích thông thường để chứa khối lượng thức ăn khổng lồ",
      "Các tia gai độc xếp dọc thân chứa độc tố thần kinh cực mạnh chống lại mọi loài cá săn mồi khác",
      "Tốc độ sinh trưởng nhanh vượt trội giúp cá non đạt độ trưởng thành sinh sản chỉ trong vòng 1 năm"
    ],
    additional_weaknesses: [
      "Tốc độ bơi tương đối chậm chạp, phụ thuộc hoàn toàn vào khả năng ngụy trang và phục kích bất ngờ",
      "Là loài cá mục tiêu ưa thích của các chiến dịch săn bắt bằng lao của thợ lặn ở những vùng xâm lấn",
      "Sự rực rỡ của thân hình khiến chúng khó ẩn nấp ở vùng cát trống trải thiếu rạn đá ẩn nấp"
    ],
    additional_fun_facts: [
      "Cá sư tử phun các luồng nước nhỏ vào con mồi để đánh lạc hướng và buộc con mồi quay đầu về phía chúng trước khi đớp",
      "Chúng là loài sinh vật xâm lấn nguy hại tàn phá hệ sinh thái rạn san hô nghiêm trọng ở vùng biển Caribe và vịnh Mexico",
      "Chúng có tập tính săn mồi theo nhóm nhỏ bằng cách dàn hàng ngang vây để gom các đàn cá con lại"
    ],
    additional_sources: [
      {
        url: "https://doi.org/10.1007/s10530-011-0023-2",
        label: "Invasive lionfish ecology and impact"
      },
      {
        url: "https://doi.org/10.1016/j.toxicon.2016.11.258",
        label: "Characterization of lionfish venom proteins"
      }
    ]
  },
  "lions-mane-jellyfish": {
    diet_type: "carnivore",
    diet_items: [
      "Cá nhỏ",
      "Sứa trăng",
      "Giáp xác nhỏ",
      "Sinh vật phù du",
      "Ấu trùng biển"
    ],
    activity_pattern: "variable",
    lifespan_min: 1,
    lifespan_max: 1,
    lifespan_unit: "years",
    reproduction_type: "sexual",
    reproduction_notes: "Vòng đời xen kẽ thế hệ phức tạp: sứa medusa trưởng thành sinh sản hữu tính, giải phóng trứng và tinh trùng vào nước tạo thành ấu trùng planula. Planula bám đáy phát triển thành polyp. Polyp sinh sản vô tính qua strobilation phân cắt ra nhiều ephyra non.",
    locomotion: "swim",
    speed_max: 1.5,
    conservation_status: "LC",
    size_min_mm: 500,
    size_max_mm: 2100,
    weight_avg_g: 150000,
    additional_strengths: [
      "Nọc độc Cyanea peptide có tính hướng tim cực mạnh gây tê liệt nhịp tim nhanh chóng",
      "Sở hữu tới 1200 xúc tu dài tạo thành mạng lưới săn mồi khổng lồ thụ động hoàn hảo",
      "Mật độ túi nematocyst đậm đặc nhất ngành ruột khoang cho khả năng phóng châm đồng loạt khi có kích ứng cơ học nhỏ"
    ],
    additional_weaknesses: [
      "Không có khả năng bơi ngược dòng hải lưu mạnh, di chuyển hoàn toàn phụ thuộc vào gió và sóng",
      "Cơ thể cấu tạo chính từ gelatin mềm, dễ bị phá hủy bởi các chướng ngại vật cứng hoặc chân vịt tàu",
      "Không chịu được nhiệt độ nước biển tăng cao trên 15-18 độ C, cơ thể sẽ bị thoái hóa gelatin"
    ],
    additional_fun_facts: [
      "Các xúc tu của sứa bờm sư tử vẫn duy trì hoạt tính phóng độc mạnh mẽ ngay cả khi đã đứt lìa khỏi chuông hoặc sứa đã chết nhiều ngày",
      "Một số loài cá con thường tìm cách bơi giữa các xúc tu của sứa để được bảo vệ khỏi động vật ăn thịt do chúng có lớp nhầy kháng độc",
      "Chuông sứa có cấu tạo 8 thùy giống ngôi sao và chứa các túi thăng bằng rhopalia giúp sứa định vị phương hướng chìm nổi"
    ],
    additional_sources: [
      {
        url: "https://doi.org/10.1007/s00227-017-3209-6",
        label: "Population structure and biology of Cyanea capillata"
      },
      {
        url: "https://doi.org/10.1016/j.toxicon.2017.03.012",
        label: "Stinging mechanism and venom profile of giant jellyfish"
      }
    ]
  }
};

const enrichedTargets = targets.map(c => {
  const enc = enrichments[c.id];
  if (!enc) return c;

  // Unique merge logic:
  // 1. Biological fields
  const updated = {
    ...c,
    diet_type: enc.diet_type,
    diet_items: enc.diet_items,
    activity_pattern: enc.activity_pattern,
    lifespan_min: enc.lifespan_min,
    lifespan_max: enc.lifespan_max,
    lifespan_unit: enc.lifespan_unit,
    reproduction_type: enc.reproduction_type,
    reproduction_notes: enc.reproduction_notes,
    locomotion: enc.locomotion,
    speed_max: enc.speed_max,
    conservation_status: enc.conservation_status,
    size_min_mm: enc.size_min_mm,
    size_max_mm: enc.size_max_mm,
    weight_avg_g: enc.weight_avg_g
  };

  // 2. Strengths - deduplicate and merge
  const strengthsSet = new Set([...c.strengths, ...enc.additional_strengths]);
  updated.strengths = Array.from(strengthsSet);

  // 3. Weaknesses - deduplicate and merge
  const weaknessesSet = new Set([...c.weaknesses, ...enc.additional_weaknesses]);
  updated.weaknesses = Array.from(weaknessesSet);

  // 4. Fun Facts - deduplicate and merge
  const funFactsSet = new Set([...c.fun_facts, ...enc.additional_fun_facts]);
  updated.fun_facts = Array.from(funFactsSet);

  // 5. Sources - merge and deduplicate by URL
  const existingUrls = new Set(c.sources.map(s => s.url));
  const newSources = enc.additional_sources.filter(s => !existingUrls.has(s.url));
  updated.sources = [...c.sources, ...newSources];

  // 6. Increment enrichment count by 1
  updated.enrichment_count = (c.enrichment_count || 0) + 1;

  return updated;
});

fs.writeFileSync(outputPath, JSON.stringify(enrichedTargets, null, 2), "utf-8");
console.log("Enriched targets written to temp-enrich.json");
