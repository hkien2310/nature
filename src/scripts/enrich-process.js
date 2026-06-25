const fs = require('fs');
const path = require('path');

const targetsPath = path.join(__dirname, '../../targets.json');
const enrichPath = path.join(__dirname, 'temp-enrich.json');

if (!fs.existsSync(targetsPath)) {
  console.error("targets.json not found!");
  process.exit(1);
}

const fileData = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
const targets = fileData.targets;

const enriched = targets.map(c => {
  const newC = { ...c };
  newC.enrichment_count = (c.enrichment_count || 0) + 1;

  if (c.id === 'giant-manta-ray') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["giáp xác nhỏ", "sinh vật phù du", "nhuyễn thể krill", "cá nhỏ", "ấu trùng sinh vật biển"];
    newC.activity_pattern = 'variable';
    newC.lifespan_min = 40;
    newC.lifespan_max = 50;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'viviparous';
    newC.reproduction_notes = 'Bản chất noãn thai sinh (ovoviviparous). Trứng nở bên trong cơ thể mẹ, phôi được nuôi dưỡng bằng chất lỏng tử cung (histotrophe) giàu dinh dưỡng thay vì nhau thai. Thời gian mang thai kéo dài từ 12 đến 13 tháng, đẻ duy nhất 1 con non (sải cánh khi sinh đạt tới 1.4-1.5 mét). Chu kỳ sinh sản chậm, cứ 2-3 năm mới đẻ một lần.';
    newC.locomotion = 'swim';
    newC.speed_max = 24.0;
    newC.conservation_status = 'EN';
    newC.size_min_mm = 4500.0;
    newC.size_max_mm = 7000.0;
    newC.weight_avg_g = 1600000.0;

    newC.characteristics = (c.characteristics || "") + " Sở hữu hệ thống lọc sụn mang tinh xảo dạng phiến xếp chồng chéo ngăn chặn tạp chất lọt vào hệ hô hấp.";
    newC.survival_method = (c.survival_method || "") + " Tận dụng luồng nước đối lưu qua vây ngực sải lớn để tạo lực đẩy thụ động giúp duy trì hô hấp liên tục mà không tiêu tốn nhiều calo.";
    newC.unique_traits = (c.unique_traits || "") + " Não bộ có vùng tiểu não (cerebellum) cực kỳ phát triển tương đương động vật có vú, điều khiển hành vi bơi lượn nhào lộn phức tạp.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/jfb.12818",
        "label": "Journal of Fish Biology - Manta ray biology and ecology"
      },
      {
        "url": "https://www.mantatrust.org/giant-oceanic-manta-ray",
        "label": "Manta Trust - Giant Oceanic Manta Ray Species Guide"
      }
    ];

  } else if (c.id === 'giant-moray-eel') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá rạn san hô", "bạch tuộc", "cua", "tôm biển", "mực ống"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 15;
    newC.lifespan_max = 30;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Thụ tinh ngoài theo mùa. Con cái phóng ra hàng ngàn quả trứng nhỏ trôi nổi vào cột nước, trứng sẽ trôi theo dòng hải lưu và nở thành ấu trùng leptocephalus trong suốt dẹt hình chiếc lá trước khi biến thái thành cá con.';
    newC.locomotion = 'swim';
    newC.speed_max = 15.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 1500.0;
    newC.size_max_mm = 3000.0;
    newC.weight_avg_g = 26000.0;

    newC.characteristics = (c.characteristics || "") + " Hệ thống xương sườn linh hoạt không có đai ngực giúp chúng thu nhỏ chu vi cơ thể khi chui rúc.";
    newC.survival_method = (c.survival_method || "") + " Phủ dịch nhầy glycoprotein chứa enzyme lysozyme kháng khuẩn mạnh trên da để tự bảo vệ trước các tổn thương vật lý từ san hô.";
    newC.unique_traits = (c.unique_traits || "") + " Cấu trúc răng nanh có khớp nối cơ học đàn hồi có thể gập ngược vào trong khi nuốt mồi.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1038/nature06062",
        "label": "Nature - Moray Eels use Pharyngeal Jaws to Capture Prey"
      },
      {
        "url": "https://www.fishbase.se/summary/Gymnothorax-javanicus.html",
        "label": "FishBase - Gymnothorax javanicus Detailed Profile"
      }
    ];

  } else if (c.id === 'giant-otter') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá da trơn", "cá hổ characin", "cá sấu caiman nhỏ", "trăn anaconda nhỏ", "cua nước ngọt"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 10;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Chu kỳ mang thai khoảng 64-72 ngày. Đẻ từ 1 đến 5 con non sơ sinh trong hang ngầm ven sông. Các thành viên trong đàn cùng luân phiên bảo vệ hang và đi săn đem mồi về nuôi con non.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 14.0;
    newC.conservation_status = 'EN';
    newC.size_min_mm = 1500.0;
    newC.size_max_mm = 1800.0;
    newC.weight_avg_g = 28000.0;

    newC.characteristics = (c.characteristics || "") + " Tuyến dầu mỡ dưới da tiết chất nhờn bao phủ lông giúp gia tăng độ chống thấm nước khi lặn sâu.";
    newC.survival_method = (c.survival_method || "") + " Tạo lập các bờ dốc bùn thoải ven sông làm lối thoát hiểm chớp nhoáng khi bị động vật trên cạn phục kích.";
    newC.unique_traits = (c.unique_traits || "") + " Có khả năng thay đổi tần số âm thanh gầm rú lên đến 22 cao độ khác nhau để truyền thông tin chiến thuật từ xa.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://www.otterspecialistgroup.org/osg-newsite/giant-otter/",
        "label": "IUCN Otter Specialist Group - Giant Otter Biological Data"
      },
      {
        "url": "https://academic.oup.com/mspecies/article/doi/10.2307/3504005/2600788",
        "label": "Mammalian Species - Pteronura brasiliensis biological profile"
      }
    ];

  } else if (c.id === 'giant-pacific-octopus') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cua biển", "tôm hùm", "sò biển", "cá nhỏ", "cá mập nhỏ"];
    newC.activity_pattern = 'nocturnal';
    newC.lifespan_min = 3;
    newC.lifespan_max = 5;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính một lần duy nhất trong đời (semelparity). Con đực chuyển túi tinh cho con cái qua xúc tu chuyên biệt (hectocotylus). Con cái đẻ tới 100.000 trứng và dành 6 tháng canh gác trứng không ăn uống cho đến khi trứng nở rồi chết.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 40.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 3000.0;
    newC.size_max_mm = 5000.0;
    newC.weight_avg_g = 32500.0;

    newC.characteristics = (c.characteristics || "") + " Lớp biểu bì chứa cấu trúc cơ vòng nhỏ giúp biến đổi bề mặt da phẳng mịn thành gai nhọn thô ráp trong tích tắc.";
    newC.survival_method = (c.survival_method || "") + " Sử dụng chất mực tyrosinase có khả năng gây tê liệt tạm thời thụ thể hóa học của cá mập đầu búa.";
    newC.unique_traits = (c.unique_traits || "") + " Có các bó hạch thần kinh phân bố độc lập tại gốc mỗi xúc tu cho phép xử lý tín hiệu cảm giác cục bộ mà không qua não trung ương.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/joa.12879",
        "label": "Journal of Anatomy - Enteroctopus dofleini nervous system"
      },
      {
        "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6400513/",
        "label": "NCBI - Enteroctopus dofleini genomic insights and neurobiology"
      }
    ];

  } else if (c.id === 'giant-snakehead') {
    newC.diet_type = 'carnivore';
    newC.diet_items = ["cá nước ngọt", "ếch nhái", "tôm cua sông", "chim nước nhỏ", "rắn nước"];
    newC.activity_pattern = 'diurnal';
    newC.lifespan_min = 10;
    newC.lifespan_max = 15;
    newC.lifespan_unit = 'years';
    newC.reproduction_type = 'sexual';
    newC.reproduction_notes = 'Sinh sản hữu tính. Thụ tinh ngoài. Làm tổ hình tròn từ cỏ nước ven hồ. Đẻ hàng ngàn trứng nổi trên mặt nước. Cả cá bố và mẹ luân phiên tuần tra bảo vệ nghiêm ngặt ổ trứng và đàn con non ròng ròng.';
    newC.locomotion = 'hybrid';
    newC.speed_max = 20.0;
    newC.conservation_status = 'LC';
    newC.size_min_mm = 1000.0;
    newC.size_max_mm = 1300.0;
    newC.weight_avg_g = 4500.0;

    newC.characteristics = (c.characteristics || "") + " Xương sọ và xương nắp mang được gia cố bằng các bản xương dẹp dày bảo vệ vùng đầu khi di chuyển vượt cạn.";
    newC.survival_method = (c.survival_method || "") + " Đắp tổ bùn nông vào mùa nước cạn để giữ ẩm tối đa cho da ngăn ngừa thoát hơi nước.";
    newC.unique_traits = (c.unique_traits || "") + " Sở hữu hệ cơ trắng đuôi có cấu trúc bó cơ phân nhánh sâu giúp sinh lực đẩy bứt tốc đớp mồi cực đại.";

    newC.sources = [
      ...(c.sources || []),
      {
        "url": "https://doi.org/10.1111/j.1095-8649.2003.00199.x",
        "label": "Journal of Fish Biology - Air-breathing physiology of Channa"
      },
      {
        "url": "https://doi.org/10.1007/s10641-011-9954-4",
        "label": "Environmental Biology of Fishes - Parental care and nesting behavior in Channa"
      }
    ];
  }

  return newC;
});

fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), 'utf8');
console.log("Successfully generated temp-enrich.json with enriched data!");
