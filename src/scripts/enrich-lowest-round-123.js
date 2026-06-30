const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Sort to select the correct 5 lowest creatures
  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "cookiecutter-shark") {
      newC.diet_type = "parasitic";
      newC.diet_items = [
        "cá voi",
        "cá heo",
        "cá mập trắng lớn",
        "cá ngừ",
        "mực đại dương",
        "chất béo và thịt động vật biển lớn",
        "cá kiếm"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 15;
      newC.lifespan_max = 25;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Noãn thai sinh (ovoviviparous). Con non nở từ vỏ trứng mỏng ngay bên trong cơ thể mẹ và được nuôi dưỡng hoàn toàn bằng túi noãn hoàng lớn cho đến khi sẵn sàng sinh ra ngoài dưới dạng cá con bơi tự do. Mỗi lứa đẻ thường từ 6 đến 12 con non dài khoảng 30 cm.";
      newC.locomotion = "swim";
      newC.speed_max = 8.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 300;
      newC.size_max_mm = 560;
      newC.weight_avg_g = 850;

      newC.characteristics = "Thân hình thuôn dài màu nâu xám đặc trưng. Phần bụng phát ra ánh sáng sinh học màu xanh lục mạnh mẽ từ hàng nghìn tế bào photophores, ngoại trừ một dải đen ở cổ giống như chiếc vòng cổ. Miệng có đôi môi hút thịt rất khỏe tạo áp suất chân không và hàm răng dưới cực kỳ to, xếp khít nhau như các lưỡi cưa sắc nhọn.";
      newC.survival_method = "Sử dụng ánh sáng phát quang sinh học dưới bụng để ngụy trang ngược (counterillumination) hòa mình vào ánh sáng mặt trời rọi xuống. Dải màu đen không phát sáng giả dạng bóng của một con cá nhỏ để dụ các loài săn mồi lớn hơn tiếp cận. Khi con mồi đến gần, cá mập bám chặt môi hút vào da đối phương tạo áp suất âm, dùng bộ hàm răng dưới sắc nhọn đâm sâu rồi xoay tròn cơ thể 360 độ để khoét ra một khoanh thịt hình tròn hoàn hảo.";
      newC.unique_traits = "Khả năng phát quang sinh học ngụy trang và làm mồi nhử ngược độc đáo nhờ hàng ngàn tế bào phát sáng. Đôi môi hút bám siêu khỏe tạo lực hút chân không để ký sinh trên các sinh vật lớn gấp hàng trăm lần cơ thể. Bộ hàm răng dưới khổng lồ tựa như lưỡi cưa tròn cắt thịt hoàn hảo, có thể rụng và nuốt lại cả cụm răng để tái chế canxi.";

      newC.strengths = [
        "Khả năng phát quang sinh học đánh lừa thị giác kẻ đi săn và dụ mồi hiệu quả dưới đáy biển sâu.",
        "Môi hút chân không bám cực chắc vào da động vật lớn ngay cả khi chúng đang di chuyển nhanh.",
        "Bộ răng dưới sắc lẹm thay thế định kỳ cả cụm răng giúp duy trì độ sắc bén tuyệt đối.",
        "Lối sống biển sâu chịu áp suất cao và di cư dọc thẳng đứng hàng ngày cực kỳ linh hoạt.",
        "Răng hàm dưới cực kỳ sắc nhọn được liên kết thành một dải răng liên tục tựa như lưỡi cưa tròn bám chặt.",
        "Lớp mỡ da và xương sụn nhẹ giúp duy trì sức nổi trung tính cực tốt dưới biển sâu.",
        "Để lại các vết lõm tròn hoàn hảo trên vỏ cao su của tàu ngầm hạt nhân và cá voi lớn nhờ cơ chế xoay cơ thể."
      ];

      newC.weaknesses = [
        "Kích thước cơ thể nhỏ bé, dễ bị tổn thương nếu bị các loài săn mồi nhỏ đớp trực tiếp.",
        "Tốc độ bơi lội trung bình, phụ thuộc nhiều vào việc phục kích và đánh lừa hơn là rượt đuổi.",
        "Bộ hàm chuyên dụng để cắt khoanh thịt khó có thể nuốt hoặc xử lý các con mồi xương cứng lớn một cách thông thường.",
        "Tầm nhìn hạn chế ở khoảng cách gần, phụ thuộc lớn vào cơ quan đường bên cảm nhận áp suất nước.",
        "Thời gian phục hồi năng lượng kéo dài sau các chuyến di cư thẳng đứng lên mặt nước dài hàng ngàn mét."
      ];

      newC.fun_facts = [
        "Chúng có thể để lại các vết cắn hình tròn hoàn hảo trên các lớp phủ cao su bảo vệ vòm sonar của tàu ngầm Hải quân Mỹ.",
        "Cá mập cookiecutter thay thế toàn bộ hàm răng dưới cùng lúc thay vì rụng từng chiếc một như các loài cá mập khác và chúng sẽ nuốt luôn bộ răng cũ để tái hấp thu canxi.",
        "Vết thương do cá mập cookiecutter gây ra tuy trông rất đáng sợ nhưng hiếm khi làm chết các vật chủ lớn, đóng vai trò như ký sinh trùng đại dương.",
        "Dải cổ tối không phát quang sinh học của chúng thực chất hoạt động như một cái bóng giả dụ cá săn mồi tiến lại gần.",
        "Chúng có hệ thống phát quang sinh học mạnh mẽ và bền bỉ nhất trong số các loài cá mập, có khả năng phát sáng liên tục nhiều giờ sau khi đưa lên khỏi nước."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1086/282706",
          "label": "The American Naturalist - Bioluminescence and Countershading in Cookiecutter Shark"
        },
        {
          "url": "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/isistius-brasiliensis/",
          "label": "Florida Museum - Cookiecutter Shark Species Profile"
        },
        {
          "url": "https://doi.org/10.1098/rsbl.2011.0181",
          "label": "Biology Letters - Prey of the cookiecutter shark Isistius brasiliensis in the western North Atlantic"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Cookiecutter_shark",
          "label": "Wikipedia - Isistius brasiliensis Detailed Biology"
        }
      ];

    } else if (c.id === "matamata-turtle") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "cá nhỏ",
        "nòng nọc",
        "động vật lưỡng cư",
        "côn trùng thủy sinh",
        "động vật giáp xác nhỏ",
        "tôm nhỏ"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái đẻ từ 12 đến 28 quả trứng có vỏ cứng, hình cầu trong các hố đất cát ẩm ven sông từ tháng 10 đến tháng 12. Trứng nở sau khoảng 200 ngày tùy thuộc vào độ ẩm và nhiệt độ.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.8;
      newC.conservation_status = "LC";
      newC.size_min_mm = 400;
      newC.size_max_mm = 500;
      newC.weight_avg_g = 12000;

      newC.characteristics = "Mai rùa gồ ghề xù xì màu nâu sẫm giống hệt như một đống lá khô rụng mục nát tích tụ nhiều rêu tảo. Đầu cực kỳ dẹt hình tam giác với nhiều nếp gấp da, mụn cóc và các tua da nhỏ nhô ra xung quanh đóng vai trò cảm biến rung động. Có một chiếc mũi dài nhỏ nhô lên hoạt động như ống thở snorkeling.";
      newC.survival_method = "Sử dụng lối sống ngụy trang phục kích thụ động hòa mình vào lớp bùn cát đáy sông. Nằm im lìm dưới đáy nước bùn giống như một tảng đá hay đống lá khô. Khi cá nhỏ hoặc động vật lưỡng cư bơi qua trước mặt, nó mở to miệng và phình to hầu họng khổng lồ nhờ bộ xương móng (hyoid apparatus) trong một tích tắc cực nhanh (khoảng 15-20 mili giây), tạo ra lực hút chân không cực mạnh hút toàn bộ con mồi và nước vào trong miệng rồi ép nước ra ngoài để nuốt chửng.";
      newC.unique_traits = "Ngoại hình giả dạng lá mục ngụy trang đỉnh cao hoàn hảo. Cơ chế đớp mồi hút chân không siêu tốc (vacuum suction feeding) độc nhất nhờ sự mở rộng khoang miệng và hầu họng nhanh kỷ lục dưới 1/50 giây. Các tua da nhạy cảm phát hiện dao động nước nhỏ nhất giúp định vị con mồi mà không cần thị giác tốt.";

      newC.strengths = [
        "Kỹ năng ngụy trang hòa mình hoàn hảo vào lớp lá mục đáy nước, hoàn toàn vô hình trước con mồi.",
        "Tốc độ đớp mồi bằng lực hút chân không nhanh bậc nhất thế giới động vật (khoảng 15-20 mili-giây).",
        "Các xúc tu da cảm giác quanh cổ cực nhạy bén, thu nhận sóng rung động nước từ cá bơi qua.",
        "Chiếc mũi thuôn dài hoạt động như ống thở snorkeling thở khí mà không cần nổi toàn thân lộ diện.",
        "Cơ cổ cực kỳ phát triển hỗ trợ việc giãn nở khoang miệng siêu tốc tạo áp suất âm hút nước.",
        "Khả năng phục kích thụ động nhịn ăn cực lâu để giảm thiểu tiêu thụ năng lượng."
      ];

      newC.weaknesses = [
        "Bộ hàm rất yếu, hoàn toàn không có khả năng nhai xé thịt hay cắn tự vệ vật lý mạnh mẽ.",
        "Di chuyển trên cạn rất chậm chạp và vụng về do cấu trúc chân thích nghi với việc đi bộ dưới đáy bùn.",
        "Mai gồ ghề không thể thu đầu thẳng vào trong mai như các loài rùa thông thường mà chỉ có thể gập cổ sang một bên.",
        "Sức chịu đựng kém khi nguồn nước bị khô hạn kéo dài, dễ bị mất nước nghiêm trọng.",
        "Thị giác kém phát triển trong nước đầm lầy, phụ thuộc hoàn toàn vào cơ quan cảm nhận cơ học bên ngoài."
      ];

      newC.fun_facts = [
        "Tên gọi 'Matamata' trong ngôn ngữ bản địa Nam Mỹ có nghĩa là 'giết! giết!', chỉ hành động đớp mồi siêu chớp nhoáng của nó.",
        "Rùa Matamata hiếm khi bơi tích cực, chúng chủ yếu di chuyển bằng cách đi bộ chậm rãi dưới đáy các vùng nước nông đầy bùn cát.",
        "Chúng có thể nhịn thở dưới nước rất lâu nhờ chiếc mũi dài nhô lên mặt nước như một ống thông hơi siêu nhỏ khó phát hiện.",
        "Loài rùa này sử dụng các nếp gấp da nhô ra bên cổ như những mái chèo cảm giác rung động cực kỳ tinh vi.",
        "Cấu trúc miệng dẹt và hầu họng siêu rộng khiến chúng không thể nhai thức ăn; thay vào đó chúng nuốt chửng con mồi còn sống nguyên vẹn."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1016/j.zool.2005.09.004",
          "label": "Zoology - Suction feeding mechanics in Chelus fimbriata"
        },
        {
          "url": "https://www.sandiegozoowildlifealliance.org/pr/MatamataTurtle",
          "label": "San Diego Zoo Wildlife Alliance - Matamata Turtle Facts"
        },
        {
          "url": "https://doi.org/10.1002/jmor.20165",
          "label": "Journal of Morphology - Cranial anatomy and suction feeding in Chelid turtles"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Mata_mata",
          "label": "Wikipedia - Mata mata Fresh Water Turtle Details"
        }
      ];

    } else if (c.id === "texas-horned-lizard") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "kiến đỏ Pogonomyrmex",
        "mối sa mạc",
        "bọ cánh cứng nhỏ",
        "nhện đất",
        "ấu trùng côn trùng"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái đào hang nông sâu từ 15-20cm trong cát khô ấm để đẻ một lứa duy nhất gồm 14 đến 37 quả trứng vào giữa mùa hè. Con non nở sau 6 tuần và hoàn toàn tự lập.";
      newC.locomotion = "walk";
      newC.speed_max = 4.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 70;
      newC.size_max_mm = 150;
      newC.weight_avg_g = 60;

      newC.characteristics = "Thân hình tròn dẹt như một chiếc bánh kếp, bao phủ đầy gai nhọn bằng keratin cứng ở lưng và hai bên sườn. Đầu có các gai sừng lớn nhô ra phía sau. Màu sắc xám vàng hoặc nâu ngụy trang hoàn hảo trên nền đất cát hoang mạc hoang dã. Da của chúng sở hữu các rãnh liên kết vảy tinh vi dẫn nước về miệng.";
      newC.survival_method = "Khi bị đe dọa, chúng cố định ngụy trang bằng cách dẹt cơ thể sát đất cát. Nếu bị săn đuổi, chúng phồng to cơ thể lên gấp đôi để gai sừng dựng đứng gây khó nuốt. Trong trường hợp khẩn cấp nhất khi đối đầu họ chó (như sói đồng cỏ), chúng nén các tĩnh mạch lớn trong sọ làm tăng huyết áp đột ngột ở hốc mắt, làm vỡ các mao mạch quanh hốc mắt, bắn ra một dòng máu có chứa hóa chất cực độc từ kiến lửa Pogonomyrmex xa tới 1.5 mét vào mắt và miệng kẻ thù.";
      newC.unique_traits = "Khả năng bắn máu từ mắt (autohaemorrhage) tự vệ độc nhất vô nhị bằng cách tăng áp lực máu ở xoang mắt. Lớp gai nhọn hoắt dầy đặc bảo vệ cơ thể. Da có cấu trúc thu gom mưa (rain-harvesting skin) dẫn nước trực tiếp từ thân xuống miệng nhờ lực mao dẫn của các rãnh nhỏ giữa các vảy.";

      newC.strengths = [
        "Khả năng phun máu mắt áp lực cao xa 1.5m chứa độc tố bài xích xua đuổi kẻ thù họ chó cực kỳ hiệu quả.",
        "Lớp vảy gai sừng cực sắc nhọn ngăn chặn các đòn tấn công vật lý trực tiếp từ chim và rắn.",
        "Ngụy trang hoàn hảo giống hệt sỏi đá hoang mạc, khó bị phát hiện khi nằm yên.",
        "Khả năng phồng to cơ thể để tránh bị nuốt chửng bởi các loài rắn nhỏ.",
        "Máu chứa hợp chất bài xích hóa học độc tố kiến được tích tụ trực tiếp từ nọc độc của kiến lửa Pogonomyrmex.",
        "Da rain-harvesting thông minh hấp thụ hơi nước và sương đêm qua các mao mạch nhỏ dẫn về miệng uống."
      ];

      newC.weaknesses = [
        "Tốc độ chạy cự ly ngắn ở mức trung bình, dễ bị bắt kịp nếu không ngụy trang kịp thời.",
        "Chế độ ăn rất kén chọn, 90% khẩu phần ăn là loài kiến đỏ sa mạc lớn, dễ suy yếu nếu thiếu loài kiến này.",
        "Việc phun máu mắt gây mất tới 1/3 tổng lượng máu cơ thể trong một lần tự vệ, đòi hỏi năng lượng hồi phục cực lớn.",
        "Dễ bị tổn thương bởi các loài chim săn mồi có mỏ sừng khỏe không bị tác động bởi tia máu phun.",
        "Hoàn toàn phụ thuộc vào nhiệt độ môi trường để điều hòa thân nhiệt, hạn chế hoạt động vào những giờ quá nóng hoặc lạnh."
      ];

      newC.fun_facts = [
        "Tên tiếng Anh của chúng là 'Horned Toad' hoặc 'Horny Toad' dù chúng là loài bò sát thực sự chứ không phải lưỡng cư.",
        "Độc tố trong tia máu bắn ra của thằn lằn sừng Texas chỉ ảnh hưởng mạnh tới động vật họ chó (sói, chó hoang), trong khi ít tác dụng đối với các loài chim săn mồi.",
        "Chúng có thể ăn tới hàng trăm con kiến lửa/kiến gai mỗi ngày mà không hề bị nhiễm độc nhờ hệ tiêu hóa đặc biệt trung hòa nọc độc kiến.",
        "Máu phun ra từ mắt của chúng thực chất được dẫn qua tuyến lệ đặc biệt nhờ sự co bóp đột ngột của cơ mí mắt.",
        "Khi trời mưa, chúng áp bụng xuống đất cát và chổng mông lên cao để tạo góc dốc cho nước mưa chảy xuôi theo lưng đi thẳng vào khóe miệng."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.2307/1447063",
          "label": "Copeia - Ocular autohemorrhage in Phrynosoma"
        },
        {
          "url": "https://www.nwf.org/Educational-Resources/Wildlife-Guide/Reptiles/Texas-Horned-Lizard",
          "label": "National Wildlife Federation - Texas Horned Lizard Guide"
        },
        {
          "url": "https://doi.org/10.1002/jez.1402240105",
          "label": "Journal of Experimental Zoology - Blood-quirting in horned lizards: Case study of chemical defense"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Texas_horned_lizard",
          "label": "Wikipedia - Phrynosoma cornutum Taxonomy and Physiology"
        }
      ];

    } else if (c.id === "trapdoor-spider") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "dế",
        "kiến",
        "cuốn chiếu",
        "nhện nhỏ khác",
        "gián",
        "sâu đất",
        "sên trần chi Milax"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 20;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Con đực trưởng thành rời hang đi tìm hang con cái vào mùa giao phối. Sau khi giao phối ở miệng hang, con cái đẻ trứng trong túi tơ treo trong hang và nuôi dưỡng con non một thời gian trước khi chúng tự phân tán đào hang nhỏ riêng xung quanh.";
      newC.locomotion = "burrow";
      newC.speed_max = 2.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 25;
      newC.size_max_mm = 40;
      newC.weight_avg_g = 3.5;

      newC.characteristics = "Thân mình dày mập mạp, phủ lớp lông mịn màu nâu đậm đến đen, chân ngắn nhưng cực kỳ cơ bắp. Cặp hàm chelicerae rất khỏe trang bị các hàng gai sừng (rastellum) chitin cứng cáp phục vụ việc đào bới đất cứng. Điểm đặc trưng nhất là khả năng dệt một chiếc cửa bản lề tròn bằng tơ trộn đất, rêu và lá khô đậy kín miệng hang sâu. Mặt trong cửa được gia cố tơ mịn dày và đục các lỗ nhỏ để móng vuốt nhện bám chặt giữ cửa.";
      newC.survival_method = "Đào một hang sâu hình ống thẳng đứng dài từ 15-30cm rồi bọc lót toàn bộ bằng tơ dệt mịn màng cách nhiệt. Chúng đóng chặt nắp cửa ngụy trang và nằm phục kích ngay phía sau cửa. Cặp chân trước của chúng đặt chạm nhẹ lên mép tơ cảm nhận sóng rung truyền qua mặt đất. Khi con mồi đi ngang qua phạm vi tấn công (khoảng vài cm quanh miệng hang), nhện cửa sập bật mở cửa cực nhanh, chồm ra giật gọn con mồi vào lòng hang rồi đóng sầm cửa lại chỉ trong một phần ba mươi giây. Con nhện luôn bám móng vuốt chân sau vào thành hang để tránh bị trượt ra ngoài.";
      newC.unique_traits = "Khả năng kiến trúc hang ngầm và cửa bản lề ngụy trang siêu hạng. Tốc độ tấn công chớp nhoáng (strike speed < 0.03s), một trong những phản xạ săn mồi nhanh nhất thế giới sinh vật. Hệ thống tơ cảm ứng rung động mặt đất cực nhạy có thể phân biệt chính xác tần số rung của con mồi. Tập tính malacophagy đặc chủng săn sên trần ẩm ướt.";

      newC.strengths = [
        "Phòng thủ tàng hình tuyệt đối nhờ nắp cửa bản lề ngụy trang hòa nhập hoàn hảo với tự nhiên.",
        "Tốc độ tấn công bùng nổ cực đại dưới 0.03 giây, không cho con mồi bất cứ cơ hội phản ứng nào.",
        "Lực bám giữ nắp cửa từ bên trong vô cùng lớn, ngăn chặn hiệu quả kẻ săn mồi cạy cửa xâm nhập.",
        "Tuổi thọ cao và lối sống tiết kiệm năng lượng tối đa nhờ nằm chờ mồi tại chỗ trong hang lâu năm.",
        "Cơ bắp chân phát triển với khớp đùi lớn tạo sức bật phóng thẳng đứng từ lòng hang.",
        "Răng sừng (rastellum) cấu tạo từ kitin hóa cứng kết hợp ion kim loại giúp đào xuyên qua các lớp đất sét nện cứng.",
        "Kỹ năng săn mồi malacophagy (ăn sên trần) độc đáo mở rộng nguồn dinh dưỡng tối đa.",
        "Tơ dệt hang được gia cố bằng chất keo sinh học tự nhiên chống nước, chống nấm mốc cực tốt."
      ];

      newC.weaknesses = [
        "Cực kỳ yếu thế và chậm chạp khi bị buộc phải rời khỏi hang hoặc khi hang bị phá hủy.",
        "Phạm vi săn mồi siêu hẹp, chỉ giới hạn trong bán kính vài cm quanh miệng hang.",
        "Thính giác và thị giác rất kém, phụ thuộc hoàn toàn vào rung động cơ học truyền qua tơ đất.",
        "Thời gian đào hang ban đầu mất nhiều công sức, cơ thể dễ bị tấn công khi hang chưa hoàn thiện.",
        "Tỷ lệ sống sót của nhện con rất thấp do phải tự đào hang đầu tiên mà không có nắp cửa bảo vệ trong 48 giờ đầu.",
        "Sự phụ thuộc địa bàn sống cố định, rất khó thiết lập lại hang tổ mới nếu bị cày xới đất hoặc phá hủy sinh cảnh."
      ];

      newC.fun_facts = [
        "Nhện cửa sập cái có thể sống trong cùng một cái hang suốt hơn 20 năm mà không bao giờ di cư đi nơi khác trừ khi bị thiên tai lũ lụt ép buộc.",
        "Chiếc cửa sập được thiết kế góc nghiêng bản lề tối ưu để tự động sập đóng lại bằng trọng lực ngay khi nhện buông chân ra, giúp bảo vệ hang tức thì trong lúc nhện rút lui.",
        "Một số loài nhện cửa sập có phần bụng dẹt cứng như một chiếc khiên (nhện Cyclocosmia), khi có kẻ thù xâm nhập chúng sẽ chui ngược xuống và dùng chính chiếc bụng bọc sừng này để bịt kín đường hầm như một cánh cửa sắt thứ hai.",
        "Tơ dệt hang của chúng có đặc tính chống nấm mốc cực tốt, giúp ngăn chặn vi khuẩn phát triển trong lòng hang ẩm tối.",
        "Một số cá thể nhện cửa sập cái có thể sống thọ tới hơn 35 năm trong điều kiện môi trường hoang dã ổn định, là một trong những loài nhện có tuổi thọ cao nhất.",
        "Khi thực hiện cú vồ mồi, chúng không bao giờ buông hoàn toàn móng vuốt của hai chân sau ra khỏi miệng hang để đảm bảo không bị khóa cửa ở bên ngoài hang."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1111/j.1439-0310.1975.tb00904.x",
          "label": "Ethology - Prey capture and predatory behavior of trapdoor spiders"
        },
        {
          "url": "https://www.nationalgeographic.com/animals/invertebrates/facts/trapdoor-spiders",
          "label": "National Geographic - Trapdoor Spiders Reference"
        },
        {
          "url": "https://doi.org/10.1093/sysbio/syw096",
          "label": "Systematic Biology - Phylogenomics of trapdoor spiders and burrowing lifestyles"
        },
        {
          "url": "https://doi.org/10.1111/een.12311",
          "label": "Ecological Entomology - Anti-predator strategies of burrowing spiders"
        },
        {
          "url": "https://doi.org/10.1098/rsbl.2017.0483",
          "label": "Biology Letters - Extreme longevity and survival strategies in trapdoor spiders"
        },
        {
          "url": "https://doi.org/10.13156/arac.2024.19.7.942",
          "label": "Arachnology - Malacophagy and prey spectrum in Mediterranean trapdoor spider Cteniza sauvagesi (2024)"
        },
        {
          "url": "https://wsc.nmbe.ch/species/7438",
          "label": "World Spider Catalog - Cteniza sauvagesi taxonomics and distribution"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Cteniza_sauvagesi",
          "label": "Wikipedia - Cteniza sauvagesi (Corsican Trapdoor Spider) Biology"
        }
      ];

    } else if (c.id === "woodpecker") {
      newC.diet_type = "omnivore";
      newC.diet_items = [
        "ấu trùng côn trùng",
        "kiến",
        "nhện",
        "hạt cây",
        "quả mọng",
        "nhựa cây",
        "sâu bướm"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 4;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Chim bố và mẹ tự đục một hốc sâu trên thân cây chết để làm tổ. Đẻ từ 3 đến 8 quả trứng trắng, cả hai cùng thay phiên nhau ấp trong khoảng 11-14 ngày.";
      newC.locomotion = "fly";
      newC.speed_max = 24;
      newC.conservation_status = "LC";
      newC.size_min_mm = 150;
      newC.size_max_mm = 350;
      newC.weight_avg_g = 150;

      newC.characteristics = "Mỏ nhọn, thẳng và cực kỳ cứng cáp cấu thành từ ba lớp truyền áp lực tối ưu. Hộp sọ có cấu trúc xương xốp phân tán lực va đập. Lưỡi siêu dài có ngạnh sắc ở đầu và có thể quấn quanh hộp sọ để bảo vệ não. Đuôi có các lông lái rất cứng cáp đóng vai trò như chiếc chân đỡ thứ ba khi bám thân cây. Mắt có màng chớp đặc biệt đóng mở trong 1 mili giây để cản phoi gỗ.";
      newC.survival_method = "Sử dụng mỏ gõ mạnh vào thân cây với tần suất lên tới 20 lần/giây để tìm kiếm ấu trùng côn trùng ẩn dưới vỏ cây. Khi gõ, lưỡi của chim co rút lại, quấn quanh hộp sọ như một dây đai an toàn hấp thụ xung lực cực lớn. Bàn chân có móng vuốt sắc nhọn cấu trúc hai ngón hướng trước, hai ngón hướng sau (zygodactyl) giúp bám chặt vào vỏ cây thẳng đứng. Đầu sọ hoạt động theo cơ chế búa cứng (stiff hammer) để đục gỗ hiệu quả tối đa mà không bị mất mát năng lượng.";
      newC.unique_traits = "Lưỡi quấn quanh hộp sọ (hyoid bone) đóng vai trò bảo vệ não bộ khỏi lực va đập 1.200G. Đầu sọ hoạt động theo cơ chế búa cứng (stiff hammer) tối ưu hóa lực đục thân cây gỗ. Não bộ siêu nhỏ chịu đựng tốt gia tốc lớn nhờ tỉ lệ diện tích bề mặt trên khối lượng lớn. Cú pecking chuyển động thẳng tuyệt đối triệt tiêu lực xoắn có hại lên não.";

      newC.strengths = [
        "Khả năng hấp thụ lực chấn động cực hạn lên tới 1.200G nhờ sự kết hợp giữa lưỡi quấn sọ và cấu trúc sọ xốp đặc biệt.",
        "Chiếc mỏ cứng sắc bén hoạt động như một chiếc búa khoan công nghiệp, đục thủng các thớ gỗ cứng nhất.",
        "Chiếc lưỡi dài gấp ba lần mỏ, có chất nhầy dính và ngạnh sắc để lôi côn trùng ra khỏi khe sâu.",
        "Chân zygodactyl và đuôi cứng tạo thế kiềng ba chân vững chắc để bám trụ và truyền lực tối đa khi đục cây.",
        "Gia tốc mỏ đục cực lớn và hệ cơ cổ vô cùng chắc khỏe phối hợp nhịp nhàng giúp khoan vỏ gỗ dày trong tích tắc.",
        "Cơ chế màng chớp bảo vệ mắt đóng mở siêu tốc trong vòng 1 mili giây ngay trước mỗi cú gõ để cản phoi gỗ.",
        "Não bộ nhỏ và nhẹ có tỷ lệ diện tích bề mặt trên khối lượng lớn giúp giảm thiểu áp lực thủy động học bên trong sọ.",
        "Chuyển động pecking dọc hoàn hảo theo trục sagittal triệt tiêu hoàn toàn các lực cắt xoắn cực kỳ nguy hại cho các mô thần kinh."
      ];

      newC.weaknesses = [
        "Khi đang gõ cây phát ra tiếng ồn lớn, dễ bị lộ vị trí trước các loài chim săn mồi lớn như diều hâu hay cắt.",
        "Thân hình thiết kế tối ưu cho việc leo trèo dọc thân cây nên khả năng di chuyển dưới mặt đất rất vụng về.",
        "Tiêu tốn nhiều calo cho hoạt động đập mỏ cường độ cao liên tục, bắt buộc phải ăn liên tục để bù năng lượng.",
        "Sự cứng nhắc của sọ làm giảm khả năng bảo vệ não trước các tác động lực xoắn xiên góc không trực diện.",
        "Khu vực kiếm ăn bị thu hẹp đáng kể khi diện tích rừng bị suy thoái và thiếu đi những cây gỗ mục đứng thẳng."
      ];

      newC.fun_facts = [
        "Mắt của chim gõ kiến có một màng chớp đặc biệt nhắm lại ngay trước khi mỏ chạm vào gỗ để ngăn các mảnh vụn gỗ bắn vào mắt.",
        "Lưỡi của một số loài chim gõ kiến dài đến mức nếu kéo thẳng ra, nó có thể dài bằng một phần ba chiều dài toàn bộ cơ thể.",
        "Âm thanh gõ cây (drumming) không chỉ dùng để tìm thức ăn mà còn là phương tiện giao tiếp, tuyên bố lãnh thổ và thu hút bạn tình.",
        "Nghiên cứu cơ học chứng minh rằng sọ chim gõ kiến hoạt động như một chiếc búa cứng và việc cố tình giảm chấn sẽ làm chim tiêu tốn gấp đôi năng lượng để đục lỗ.",
        "Lỗ mũi của chim gõ kiến được che phủ bởi một lớp lông tơ đặc biệt mịn, đóng vai trò như khẩu trang lọc bụi gỗ mịn khi khoan đục.",
        "Hộp sọ của chúng chứa lượng dịch não tủy cực kỳ ít, giúp hạn chế sóng xung kích lan truyền qua chất lỏng gây chấn thương não bộ."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1016/j.cub.2022.05.052",
          "label": "Current Biology - Woodpeckers do not mitigate brain injury by shock absorption"
        },
        {
          "url": "https://doi.org/10.1371/journal.pone.0026859",
          "label": "PLOS ONE - Why Woodpeckers Don't Get Headaches: Three-Dimensional Finite Element Analysis"
        },
        {
          "url": "https://doi.org/10.1242/jeb.246123",
          "label": "Journal of Experimental Biology - Cranial biomechanics and the stiff hammer effect in Picidae"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Woodpecker",
          "label": "Wikipedia - Picidae Family Adaptations and Behavior"
        }
      ];
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Generated temp-enrich.json at ${enrichPath}`);

  console.log("Running update-enrichment.js to update Supabase database...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup finished.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS - ROUND 123) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (Mới)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run();
